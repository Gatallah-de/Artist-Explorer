// src/app/api/search/artists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/server/providers/spotify";
import { getPrimaryId } from "@/types/core";

export const dynamic = "force-dynamic";

/* ------------ helpers ------------ */
function clampInt(
  n: unknown,
  { min, max, fallback }: { min: number; max: number; fallback: number }
) {
  const num = Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(Math.trunc(num), min), max);
}

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) },
  });
}

/* ------------ GET ------------ */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

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

  if (!q) return json({ items: [] });

  try {
    // Fetch from your provider (already wired to Spotify)
    const results = await searchArtists(q);
    const sliced = (results ?? []).slice(offset, offset + limit);

    // Normalize to the shape Search.tsx expects:
    // { id: { spotify: string }, name: string, images?: [{ url?: string }] }
    const items = sliced
      .map((a: any) => {
        const spotifyId: string | undefined =
          a?.ids?.spotify ?? getPrimaryId(a?.ids);

        if (!spotifyId) return null; // we only surface entries we can link to

        const images: { url?: string }[] | undefined =
          Array.isArray(a?.images) && a.images.length
            ? a.images.map((im: any) => ({ url: im?.url }))
            : a?.image
            ? [{ url: a.image as string }]
            : undefined;

        return {
          id: { spotify: spotifyId },
          name: a?.name ?? "Unknown",
          images,
        };
      })
      .filter(Boolean);

    return json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ items: [], error: msg || "unknown error" }, { status: 500 });
  }
}
