// src/app/api/artist/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getArtist,
  getArtistTopAlbumsHeuristic,
  getArtistTopTracks,
} from "@/server/providers/spotify";
import { getArtistBio } from "@/server/providers/wikipedia";

export const dynamic = "force-dynamic";

/* ---------------- helpers ---------------- */
const TIMEOUT_MS = 6500;

function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new NextResponse(JSON.stringify(data), { ...init, headers });
}

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

/* ---------------- route ---------------- */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // Next 15: params is a Promise
) {
  try {
    const { id } = await ctx.params;
    const artistId = (id ?? "").trim();
    if (!artistId) return json({ ok: false, error: "missing id" }, { status: 400 });

    // 1) Artist (hard requirement)
    let artist: Awaited<ReturnType<typeof getArtist>> | null;
    try {
      artist = await withTimeout(getArtist(artistId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/timeout/i.test(msg)) return json({ ok: false, error: "spotify timeout" }, { status: 502 });
      if (/404/.test(msg) || /not\s*found/i.test(msg)) {
        return json({ ok: false, error: "artist not found" }, { status: 404 });
      }
      return json({ ok: false, error: "spotify error" }, { status: 502 });
    }

    if (!artist) return json({ ok: false, error: "artist not found" }, { status: 404 });

    // 2) Parallel optional data (best-effort, do not fail the whole response)
    const [albumsRes, tracksRes, bioRes] = await Promise.allSettled([
      withTimeout(getArtistTopAlbumsHeuristic(artistId)),
      withTimeout(getArtistTopTracks(artistId)),
      artist.name ? withTimeout(getArtistBio(artist.name)) : Promise.resolve(null),
    ]);

    const topAlbums =
      albumsRes.status === "fulfilled" && Array.isArray(albumsRes.value)
        ? albumsRes.value
        : [];

    const topTracks =
      tracksRes.status === "fulfilled" && Array.isArray(tracksRes.value)
        ? tracksRes.value
        : [];

    const bio =
      bioRes.status === "fulfilled" ? bioRes.value ?? null : null;

    // 3) Success envelope (no undefined)
    return json({
      ok: true,
      artist,
      topAlbums,
      topTracks,
      bio,
    });
  } catch {
    // Don’t leak internals
    return json({ ok: false, error: "server error" }, { status: 500 });
  }
}
