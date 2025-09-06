// src/app/layout.tsx
import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import { FavoritesProvider } from "@/components/useFavorites";

export const metadata: Metadata = {
  title: {
    default: "Artist Explorer",
    template: "%s — Artist Explorer",
  },
  description: "Fast artist search, top albums, concerts, and previews.",
  openGraph: {
    title: "Artist Explorer",
    description: "Find artists, albums and gigs.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0a0b10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* Neon background stack — styles live in globals.css */}
        <div className="site-bg" aria-hidden>
          <div className="site-bg__wash" />
          <div className="site-bg__rims" />
          <div className="site-bg__band" />
          <div className="site-bg__lines" />
          <div className="site-bg__bars" />
          <div className="site-bg__vignette" />
        </div>

        {/* Skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] chip"
        >
          Skip to content
        </a>

        {/* App frame */}
        <div className="min-h-screen flex flex-col">
          <Header />

          <FavoritesProvider>
            <main
              id="main"
              role="main"
              tabIndex={-1}
              className="container-x py-8 md:py-12 flex-1"
            >
              {children}
            </main>
          </FavoritesProvider>
        </div>
      </body>
    </html>
  );
}
