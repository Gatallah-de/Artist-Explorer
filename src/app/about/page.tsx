// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/Hero";

export const metadata: Metadata = {
  title: "About — Artist Explorer",
  description:
    "What this project is, how it works, and where it’s headed.",
};

export default function AboutPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      {/* Hero */}
      <Hero
        title="About Artist Explorer"
        subtitle="Fast, no-login browsing for artists, albums, and tracks — built with public APIs, privacy-first design, and a focus on simplicity."
        chips={["Open APIs", "No accounts", "Performance-first"]}
        size="md"
        align="start"
        className="min-h-0"
      />

      {/* What it is */}
      <section
        id="what"
        className="card surface rounded-token-lg p-6 md:p-7 border border-token"
        aria-labelledby="about-what"
      >
        <h2 id="about-what" className="text-xl font-semibold mb-3">
          What is this?
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Artist Explorer is a minimal music browser. It uses{" "}
          <span className="font-medium">Spotify’s Client Credentials flow</span>{" "}
          to fetch public artist, album, and track data — no personal accounts
          and no scraping. Credits and extra context come from{" "}
          <span className="font-medium">MusicBrainz</span>. The goal: a quick,
          tasteful way to jump between artists and records with previews where
          available.
        </p>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="card surface rounded-token-lg p-6 md:p-7 border border-token"
        aria-labelledby="about-how"
      >
        <h2 id="about-how" className="text-xl font-semibold mb-4">
          How it works
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card surface rounded-token p-4 border border-token">
            <h3 className="font-medium mb-1">Data sources</h3>
            <ul role="list" className="text-sm text-muted list-disc ml-5 space-y-1">
              <li>Spotify (artists, albums, tracks, previews)</li>
              <li>MusicBrainz (personnel / credits)</li>
              <li>Discogs &amp; RYM links (outbound only)</li>
            </ul>
          </div>

          <div className="card surface rounded-token p-4 border border-token">
            <h3 className="font-medium mb-1">Stack</h3>
            <ul role="list" className="text-sm text-muted list-disc ml-5 space-y-1">
              <li>Next.js App Router + TypeScript</li>
              <li>Tailwind CSS + token-driven components</li>
              <li>Server-side fetch with caching</li>
            </ul>
          </div>

          <div className="card surface rounded-token p-4 border border-token">
            <h3 className="font-medium mb-1">Privacy</h3>
            <p className="text-sm text-muted">
              No logins, no trackers, no cookies for personalization. All requests
              are handled server-side with provider tokens and results are rendered
              as HTML.
            </p>
          </div>

          <div className="card surface rounded-token p-4 border border-token">
            <h3 className="font-medium mb-1">Performance</h3>
            <p className="text-sm text-muted">
              Lightweight payloads, clean HTML, and aggressive UI reuse — with
              motion that respects{" "}
              <code className="text-xs">prefers-reduced-motion</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section
        id="roadmap"
        className="card surface rounded-token-lg p-6 md:p-7 border border-token"
        aria-labelledby="about-roadmap"
      >
        <h2 id="about-roadmap" className="text-xl font-semibold mb-4">
          Roadmap
        </h2>
        <ul role="list" className="grid md:grid-cols-2 gap-2 text-sm text-muted">
          <li className="card surface rounded-token p-3 border border-token">
            ✅ Personnel credits via MusicBrainz
          </li>
          <li className="card surface rounded-token p-3 border border-token">
            ✅ Global UX &amp; accessibility improvements
          </li>
          <li className="card surface rounded-token p-3 border border-token">
            ◻️ Release timeline / eras per artist
          </li>
          <li className="card surface rounded-token p-3 border border-token">
            ◻️ Smarter search hints &amp; keyboard actions
          </li>
          <li className="card surface rounded-token p-3 border border-token">
            ◻️ Playlists / shareable links
          </li>
        </ul>
      </section>

      {/* Credits */}
      <section
        id="credits"
        className="card surface rounded-token-lg p-6 md:p-7 border border-token"
        aria-labelledby="about-credits"
      >
        <h2 id="about-credits" className="text-xl font-semibold mb-3">
          Credits
        </h2>
        <p className="text-sm text-muted">
          Music data and imagery are provided by their respective services and
          copyright holders. This is a non-commercial demo. If you’re a rights
          holder and have questions, please reach out.
        </p>

        <div className="mt-3 text-sm">
          <Link
            href="https://developer.spotify.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline link"
          >
            Spotify for Developers
          </Link>
          <span className="px-2 text-muted">·</span>
          <Link
            href="https://musicbrainz.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline link"
          >
            MusicBrainz
          </Link>
          <span className="px-2 text-muted">·</span>
          <Link
            href="https://www.discogs.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline link"
          >
            Discogs
          </Link>
        </div>
      </section>

      {/* Feedback & Author */}
      <section
        id="feedback"
        className="card surface rounded-token-lg p-6 md:p-7 border border-token"
        aria-labelledby="about-feedback"
      >
        <h2 id="about-feedback" className="text-xl font-semibold mb-3">
          Feedback
        </h2>
        <p className="text-sm text-muted">
          Spot a bug or want a feature? Open an issue or send suggestions. PRs are
          always welcome.
        </p>
        <p className="text-sm text-muted mt-3">
          Built by <span className="font-medium">George Atallah</span>.
        </p>
      </section>
    </div>
  );
}
