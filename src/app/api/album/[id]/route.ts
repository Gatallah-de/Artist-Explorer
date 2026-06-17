// src/app/api/album/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAlbum } from "@/server/providers/spotify";

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
    const albumId = (id ?? "").trim();
    if (!albumId) return json({ ok: false, error: "missing id" }, { status: 400 });

    let album: Awaited<ReturnType<typeof getAlbum>> | null;
    try {
      album = await withTimeout(getAlbum(albumId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/timeout/i.test(msg)) return json({ ok: false, error: "spotify timeout" }, { status: 502 });
      if (/404/.test(msg) || /not\s*found/i.test(msg)) {
        return json({ ok: false, error: "album not found" }, { status: 404 });
      }
      return json({ ok: false, error: "spotify error" }, { status: 502 });
    }

    if (!album) return json({ ok: false, error: "album not found" }, { status: 404 });

    // Return a stable envelope; no undefined fields
    return json({ ok: true, album });
  } catch {
    return json({ ok: false, error: "server error" }, { status: 500 });
  }
}
