import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/server/providers/spotify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("query") ?? "";
  if (!q || q.length < 2) return NextResponse.json({ artists: [] });
  try {
    const artists = await searchArtists(q);
    return NextResponse.json({ artists });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
