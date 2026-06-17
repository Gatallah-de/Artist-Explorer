// src/app/api/artist-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/server/providers/spotify";

// Cache at the edge/CDN for an hour; clients get fast responses
export const revalidate = 3600;

/* ---------------- helpers ---------------- */
const TIMEOUT_MS = 5000;

function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new NextResponse(JSON.stringify(data), { ...init, headers });
}

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

/** A minimal, mutable shape we need just for image picking */
type ImageLike = { url?: string | null };

/** The normalized artist shape this route will work with */
type ArtistImageish =
  | {
      images?: ImageLike[]; // optional; when present must be an array
      image?: string | null;
    }
  | null
  | undefined;

/* ---------------- route ---------------- */
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
    if (!id) {
      return json({ ok: false, url: null, error: "missing id" }, { status: 400 });
    }

    let artist: ArtistImageish;

    try {
      // Get the upstream artist (likely has readonly images)
      const upstream = await withTimeout(getArtist(id));

      // Normalize to a mutable shape so TS doesn't complain
      const imgs = Array.isArray((upstream as any)?.images)
        ? (upstream as any).images.map((im: any) => ({ url: im?.url ?? null }))
        : undefined;

      const legacyImage =
        typeof (upstream as any)?.image === "string" ? (upstream as any).image : undefined;

      // IMPORTANT: only include keys when defined (exactOptionalPropertyTypes friendly)
      artist = {
        ...(imgs ? { images: imgs } : {}),
        ...(legacyImage ? { image: legacyImage } : {}),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      if (/timeout/i.test(msg)) {
        return json({ ok: false, url: null, error: "spotify timeout" }, { status: 502 });
      }
      if (/404/.test(msg) || /not\s*found/i.test(msg)) {
        return json({ ok: false, url: null, error: "artist not found" }, { status: 404 });
      }
      return json({ ok: false, url: null, error: "spotify error" }, { status: 502 });
    }

    // Prefer the first normalized image url, then legacy `image`, else null
    const url =
      artist?.images?.[0]?.url ??
      (typeof artist?.image === "string" ? artist.image : null) ??
      null;

    return json(
      { ok: true, url },
      {
        headers: {
          // cache at the CDN, allow stale while revalidating
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return json({ ok: false, url: null, error: "server error" }, { status: 500 });
  }
}
