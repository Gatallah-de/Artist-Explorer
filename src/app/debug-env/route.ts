// app/api/debug/env/route.ts
import { NextResponse } from "next/server";

type DebugEnv = {
  hasClientId: boolean;
  hasClientSecret: boolean;
  site?: string;
  runtime: string; // "edge" | "node" | custom
  node_env: "development" | "production" | "test";
};

export async function GET() {
  const body: DebugEnv = {
    hasClientId: Boolean(process.env.SPOTIFY_CLIENT_ID),
    hasClientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
    ...(process.env.NEXT_PUBLIC_SITE_URL
      ? { site: process.env.NEXT_PUBLIC_SITE_URL }
      : undefined),
    runtime: process.env.NEXT_RUNTIME ?? "node",
    node_env:
      (process.env.NODE_ENV as "development" | "production" | "test") ??
      "development",
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
