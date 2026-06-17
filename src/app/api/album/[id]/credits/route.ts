// src/app/api/album/[id]/credits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAlbum } from "@/server/providers/spotify";
import { getAlbumCreditsByMeta } from "@/server/providers/musicbrainz";

export const dynamic = "force-dynamic";

/** What we hand to MusicBrainz. Never include `year: undefined`. */
type AlbumMeta = {
  title: string;
  artist: string;
  year?: number;
};

/** Uniform JSON helpers ---------------------------------------------------- */
function json(
  data: unknown,
  init?: ResponseInit & { cache?: "no-store" | "private" | "public" }
) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", init?.cache === "public" ? "public, max-age=60" : "no-store");
  return new NextResponse(JSON.stringify(data), { ...init, headers });
}

function badRequest(msg: string) {
  return json({ ok: false, error: msg, credits: [] }, { status: 400 });
}
function notFound(msg: string) {
  return json({ ok: false, error: msg, credits: [] }, { status: 404 });
}
function upstreamError(msg: string) {
  // 502 communicates “upstream provider failed”
  return json({ ok: false, error: msg, credits: [] }, { status: 502 });
}
function serverError(msg: string) {
  return json({ ok: false, error: msg, credits: [] }, { status: 500 });
}

/** Abortable fetch helpers ------------------------------------------------- */
const TIMEOUT_MS = 6500;

/** Promise.race with a timeout to avoid hanging on provider calls */
async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return await Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

/** Route ------------------------------------------------------------------- */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // Next 15+: params is a Promise
) {
  try {
    const { id } = await ctx.params;
    const albumId = (id ?? "").trim();
    if (!albumId) return badRequest("missing id");

    // 1) Fetch album from Spotify (with timeout)
    let album: Awaited<ReturnType<typeof getAlbum>>;
    try {
      album = await withTimeout(getAlbum(albumId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Distinguish not-found vs generic upstream failure when possible
      if (/not\s*found/i.test(msg)) return notFound("album not found");
      if (/timeout/i.test(msg)) return upstreamError("spotify timeout");
      return upstreamError(`spotify error: ${msg}`);
    }

    if (!album) return notFound("album not found");

    // 2) Build clean meta (never include undefined)
    const meta: AlbumMeta = {
      title: String(album.title ?? "").trim(),
      artist: String(album.artists?.[0]?.name ?? "").trim(),
      ...(typeof album.year === "number" ? { year: album.year } : {}),
    };

    if (!meta.title || !meta.artist) {
      // If Spotify didn’t return enough to query MB, bail clearly
      return upstreamError("incomplete album data from spotify");
    }

    // 3) Query credits from MusicBrainz (with timeout)
    let credits;
    try {
      credits = await withTimeout(getAlbumCreditsByMeta(meta));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/timeout/i.test(msg)) return upstreamError("musicbrainz timeout");
      return upstreamError(`musicbrainz error: ${msg}`);
    }

    // 4) Build response (support ?debug=1)
    const debug = req.nextUrl.searchParams.get("debug") === "1";
    const body: Record<string, unknown> = { ok: true, credits };
    if (debug) body.meta = meta;

    return json(body);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return serverError(message);
  }
}
