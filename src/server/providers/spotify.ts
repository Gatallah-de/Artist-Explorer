import { env } from "@/lib/env";
import type { ArtistCore, AlbumCore } from "@/types/core";

/* ------------------------------------------------------------------ */
/*  Debug helpers (optional)                                           */
/* ------------------------------------------------------------------ */

const DEBUG = (process.env.DEBUG_SPOTIFY ?? "").trim() === "1";
function dbg(...a: any[]) {
  if (DEBUG) console.log("[spotify]", ...a);
}

/* ------------------------------------------------------------------ */
/*  Auth + low-level fetch helpers                                     */
/* ------------------------------------------------------------------ */

let cachedToken: { access_token: string; expires_at: number } | null = null;

function safeText(res: Response) {
  return res
    .text()
    .then((t) => (t && t.length < 500 ? t : ""))
    .catch(() => "");
}

async function getToken(): Promise<string> {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expires_at > now + 30) {
    return cachedToken.access_token;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" } as any),
  });

  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(
      `Failed to get Spotify token (${res.status}) ${body}`.trim(),
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  cachedToken = { access_token: data.access_token, expires_at: now + data.expires_in };
  return data.access_token;
}

async function sp(
  path: string,
  params?: Record<string, string>,
  opts: { retries?: number } = {},
) {
  const token = await getToken();
  const retries = opts.retries ?? 2;

  let attempt = 0;
  while (true) {
    const url = new URL(`https://api.spotify.com/v1/${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429 && attempt < retries) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "1");
      dbg("429 on", path, "retryAfter", retryAfter, "attempt", attempt + 1);
      await new Promise((r) =>
        setTimeout(r, Math.max(1, retryAfter) * 1000),
      );
      attempt++;
      continue;
    }

    if (!res.ok) {
      const body = await safeText(res);
      const qs = params
        ? "?" + new URLSearchParams(params).toString().slice(0, 120)
        : "";
      throw new Error(
        `Spotify ${path}${qs} -> ${res.status} ${body}`.trim(),
      );
    }
    return res.json();
  }
}

/* ------------------------------------------------------------------ */
/*  High-level providers                                               */
/* ------------------------------------------------------------------ */

export async function searchArtists(q: string): Promise<ArtistCore[]> {
  const data = await sp("search", { q, type: "artist", limit: "10" });
  return (data.artists?.items ?? []).map(
    (a: any): ArtistCore => ({
      ids: { spotify: a.id },
      name: a.name,
      images:
        a.images?.map((i: any) => ({
          url: i.url,
          width: i.width,
          height: i.height,
        })) ?? [],
      genres: a.genres ?? [],
      metrics: { popularity: a.popularity, followers: a.followers?.total },
    }),
  );
}

export async function getArtist(spotifyId: string): Promise<ArtistCore> {
  const a = await sp(`artists/${spotifyId}`);
  return {
    ids: { spotify: a.id },
    name: a.name,
    images:
      a.images?.map((i: any) => ({
        url: i.url,
        width: i.width,
        height: i.height,
      })) ?? [],
    genres: a.genres ?? [],
    metrics: { popularity: a.popularity, followers: a.followers?.total },
  };
}

export async function getArtistTopAlbumsHeuristic(
  spotifyId: string,
): Promise<AlbumCore[]> {
  try {
    const data = await sp(`artists/${spotifyId}/albums`, {
      include_groups: "album",
      market: env.DEFAULT_MARKET || "US",
      limit: "20",
    });

    const albums = data.items ?? [];

    // De-dup by normalized name, keep the first
    const seen = new Set<string>();
    const dedup = albums.filter((a: any) => {
      const key = String(a?.name ?? "").trim().toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return dedup.map((a: any): AlbumCore => {
      const base: AlbumCore = {
        ids: { spotify: a.id },
        title: a.name,
      };

      const yearStr = typeof a.release_date === "string" ? a.release_date.slice(0, 4) : "";
      const yearNum = yearStr && !Number.isNaN(Number.parseInt(yearStr, 10))
        ? Number.parseInt(yearStr, 10)
        : undefined;

      const cover =
        Array.isArray(a.images) && a.images[0] && typeof a.images[0].url === "string"
          ? a.images[0].url
          : undefined;

      const pop =
        typeof a.popularity === "number" ? a.popularity : undefined;

      // Build result by conditionally adding optional props (avoid passing undefined)
      const withYear = yearNum !== undefined ? { ...base, year: yearNum } : base;
      const withCover = cover !== undefined ? { ...withYear, cover } : withYear;
      const withMetrics =
        pop !== undefined ? { ...withCover, metrics: { popularity: pop } } : withCover;

      return withMetrics;
    });
  } catch {
    return [];
  }
}



export async function getAlbum(albumId: string) {
  try {
    const a = await sp(`albums/${albumId}`);
    return {
      ids: { spotify: a.id },
      title: a.name,
      year: a.release_date
        ? Number.parseInt(a.release_date.slice(0, 4))
        : undefined,
      cover: a.images?.[0]?.url,
      artists: (a.artists ?? []).map((x: any) => ({
        ids: { spotify: x.id },
        name: x.name,
      })),
      tracks: (a.tracks?.items ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        duration_ms: t.duration_ms,
        track_number: t.track_number,
        preview_url: t.preview_url,
      })),
      url: a.external_urls?.spotify as string | undefined,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Top tracks                                                         */
/* ------------------------------------------------------------------ */

export async function getArtistTopTracks(
  spotifyId: string,
): Promise<
  Array<{
    id: string;
    name: string;
    duration_ms: number;
    preview_url?: string;
    external_url?: string;
  }>
> {
  try {
    const data = await sp(`artists/${spotifyId}/top-tracks`, {
      market: env.DEFAULT_MARKET || "US",
    });
    return (data.tracks ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      duration_ms: t.duration_ms,
      preview_url: t.preview_url ?? undefined,
      external_url: t.external_urls?.spotify ?? undefined,
    }));
  } catch {
    return [];
  }
}
