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

  description:
    "Fast artist search, top albums, concerts, and previews.",

  openGraph: {
    title: "Artist Explorer",
    description: "Find artists, albums and gigs.",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
  },

  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0a0c16",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="
          min-h-screen
          bg-bg text-fg
          antialiased
        "
      >
        {/* Background layers */}
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
          className="
            sr-only
            focus:not-sr-only
            focus:fixed
            focus:left-4
            focus:top-4
            focus:z-[9999]
            chip
          "
        >
          Skip to content
        </a>

        <FavoritesProvider>
          <div className="flex min-h-screen flex-col">
            <Header />

            <main
              id="main"
              role="main"
              tabIndex={-1}
          className="
  container-x
  page-safe-bottom
  flex-1
  py-6 md:py-10 lg:py-12
"
            >
              {children}
            </main>
          </div>
        </FavoritesProvider>
      </body>
    </html>
  );
}
