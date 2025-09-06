// src/app/artist/[id]/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist — Artist Explorer",
  description: "Artist details, top albums and tracks.",
};

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  // Keep it simple. RootLayout already provides:
  // - Header (fixed height)
  // - <main class="container-x py-8 md:py-12"> wrapper
  // - Consistent spacing/width
  return <>{children}</>;
}
