// src/app/api/search/albums/route.ts
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/* ---------------- token cache ---------------- */
type CachedToken = { access_token: string; expires_at: number } | null;
let cachedToken: CachedToken = null;

function toBase64(input: string) {
  // Edge has btoa, Node has Buffer
  if (typeof btoa === "function") return btoa(input);
  // @ts-ignore - Node runtime
  return Buffer.from(input).toString("base64");
}

async function getToken(): Promise<string> {
  const id = env.SPOTIFY_CLIENT_ID;
  const secret = env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expires_at > now + 30) {
    return cachedToken.access_token;
  }

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${toBase64(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    // token requests should never be cached
    cache: "no-store",
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`spotify_token ${r.status}${txt ? ` ${txt}` : ""}`);
  }

  const j = (await r.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    access_token: j.access_token,
    expires_at: now + (j.expires_in ?? 0),
  };
  return j.access_token;
}

/* ---------------- helpers ---------------- */
function clampInt(
  n: unknown,
  { min, max, fallback }: { min: number; max: number; fallback: number }
) {
  const num = Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(Math.trunc(num), min), max);
}

function parseYear(dateStr?: string | null): number | undefined {
  if (!dateStr) return undefined;
  // Spotify release_date can be YYYY, YYYY-MM, or YYYY-MM-DD
  const y = Number(String(dateStr).slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) },
  });
}

/* ---------------- route ---------------- */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = clampInt(url.searchParams.get("limit"), {
    min: 1,
    max: 10,
    fallback: 5,
  });
  const offset = clampInt(url.searchParams.get("offset"), {
    min: 0,
    max: 1000,
    fallback: 0,
  });
  const market = (url.searchParams.get("market") || "US").trim();

  if (!q) return json({ items: [] });

  try {
    const token = await getToken();

    const spUrl = new URL("https://api.spotify.com/v1/search");
    spUrl.searchParams.set("q", q);
    spUrl.searchParams.set("type", "album");
    spUrl.searchParams.set("limit", String(limit));
    spUrl.searchParams.set("offset", String(offset));
    spUrl.searchParams.set("market", market);

    const sp = await fetch(spUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!sp.ok) {
      if (sp.status === 429) {
        // expose Retry-After when rate-limited
        return json(
          {
            items: [],
            error: "spotify rate-limited",
            retryAfter: sp.headers.get("Retry-After") ?? undefined,
          },
          { status: 429 }
        );
      }
      const txt = await sp.text().catch(() => "");
      return json(
        { items: [], error: `spotify ${sp.status}${txt ? ` ${txt}` : ""}` },
        { status: 502 }
      );
    }

    const data = (await sp.json()) as any;
    const items =
      (data?.albums?.items ?? []).map((a: any) => ({
        id: String(a?.id ?? ""),
        title: String(a?.name ?? ""),
        year: parseYear(a?.release_date),
        image: a?.images?.[0]?.url ? String(a.images[0].url) : undefined,
        artist: a?.artists?.[0]?.name ? String(a.artists[0].name) : undefined,
        artistId: a?.artists?.[0]?.id ? String(a.artists[0].id) : undefined,
      })) ?? [];

    return json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ items: [], error: msg || "unknown error" }, { status: 500 });
  }
}
