
// src/app/artist/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import * as React from "react";

import Hero from "@/components/Hero";
import FavButton from "@/components/FavButton";

type Img = {
  url: string;
  width?: number;
  height?: number;
};

type Artist = {
  name: string;
  genres?: string[];
  images?: Img[];
};

type Album = {
  ids: { spotify?: string };
  title: string;
  year?: number;
  cover?: string;
};

type WikiBio = {
  title: string;
  extract?: string;
  content_urls?: {
    desktop?: {
      page: string;
    };
  };
};

type Track = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url?: string;
  external_url?: string;
};

type ArtistBundle = {
  artist: Artist;
  topAlbums: Album[];
  topTracks?: Track[];
  bio?: WikiBio | null;
};

async function absBase() {
  const h = await headers();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";

  return `${proto}://${host}`;
}

function msToMin(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  return `${m}:${s}`;
}

function truncate(text: string | undefined, max = 220) {
  if (!text) return undefined;

  if (text.length <= max) return text;

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");

  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

function dedupe<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

async function getArtistMeta(id: string) {
  const base = await absBase();

  const r = await fetch(`${base}/api/artist/${id}`, {
    cache: "no-store",
  });

  if (!r.ok) {
    return {
      title: "Artist Explorer",
      desc: "Artist details",
      image: undefined as string | undefined,
    };
  }

  const j = (await r.json()) as ArtistBundle;

  const title = j.artist?.name ?? "Artist Explorer";

  const image = j.artist?.images?.[0]?.url;

  const desc =
    j.bio?.extract ??
    `Top tracks and albums for ${title}.`;

  return { title, image, desc };
}

type Param = {
  id: string;
};

export async function generateMetadata(
  { params }: { params: Promise<Param> }
): Promise<Metadata> {
  const { id } = await params;

  const m = await getArtistMeta(id);

  return {
    title: `${m.title} — Artist Explorer`,
    description: m.desc,
    openGraph: {
      title: `${m.title} — Artist Explorer`,
      description: m.desc,
      images: m.image ? [{ url: m.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${m.title} — Artist Explorer`,
      description: m.desc,
      images: m.image ? [m.image] : undefined,
    },
  };
}

async function getArtistBundle(
  id: string
): Promise<ArtistBundle> {
  const base = await absBase();

  const res = await fetch(`${base}/api/artist/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) notFound();

    const msg = await res.text().catch(() => "");

    throw new Error(
      `Artist fetch failed (${res.status}) ${msg}`.trim()
    );
  }

  return res.json();
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<Param>;
}) {
  const { id } = await params;

  const {
    artist,
    topAlbums,
    bio,
    topTracks = [],
  } = await getArtistBundle(id);

  const heroUrl = artist.images?.[0]?.url;

  const genres = dedupe(artist.genres ?? []).slice(0, 5);

  return (
    <div className="space-y-8 md:space-y-12 lg:space-y-16">
      <Hero
        size="lg"
        align="start"
        title={artist.name}
        subtitle={truncate(bio?.extract ?? "", 240) || ""}
        chips={genres}
        rightSlot={
          <FavButton
            kind="artist"
            id={id}
            title={artist.name}
            image={heroUrl}
          />
        }
        {...(heroUrl
          ? {
              bg: heroUrl,
              thumb: heroUrl,
            }
          : {})}
      />

      <section className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
        <article
          className="card flex h-full min-w-0 flex-col overflow-hidden"
          aria-labelledby="about-h"
        >
          <h2
            id="about-h"
            className="px-5 pt-5 text-xl font-semibold sm:px-6 sm:pt-6"
          >
            About
          </h2>

          <div className="min-w-0 px-5 pb-5 sm:px-6 sm:pb-6">
            {bio?.extract ? (
              <>
                <p className="break-words text-[0.95rem] leading-relaxed text-muted">
                  {bio.extract}
                </p>

                {bio.content_urls?.desktop?.page && (
                  <a
                    href={bio.content_urls.desktop.page}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm underline underline-offset-4"
                  >
                    Read more on Wikipedia →
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">
                Biography unavailable.
              </p>
            )}
          </div>
        </article>

        <article
          className="card flex h-full min-w-0 flex-col overflow-hidden"
          aria-labelledby="tracks-h"
        >
          <header className="px-5 pt-5 sm:px-6 sm:pt-6">
            <h2
              id="tracks-h"
              className="text-2xl font-semibold"
            >
              Top tracks
            </h2>
          </header>

          {topTracks.length === 0 ? (
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <p className="mt-3 text-sm text-muted">
                No top tracks available.
              </p>
            </div>
          ) : (
            <ol
              className="mt-3 flex-1 divide-y overflow-hidden"
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              {topTracks.slice(0, 10).map((track, idx) => {
                const hasPreview = Boolean(
                  track.preview_url
                );

                return (
                  <li
                    key={track.id}
                    className="
                      flex flex-col gap-3 px-5 py-4
                      sm:flex-row sm:items-center sm:justify-between
                      sm:px-6
                    "
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted">
                        {idx + 1}
                      </span>

                      <span
                        className="min-w-0 flex-1 truncate font-medium"
                        title={track.name}
                      >
                        {track.name}
                      </span>
                    </div>

                    <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-shrink-0">
                      <span className="shrink-0 text-xs tabular-nums text-muted">
                        {msToMin(track.duration_ms)}
                      </span>

                      {hasPreview ? (
                        <audio
                          controls
                          preload="none"
                          src={track.preview_url}
                          className="min-w-0 flex-1 sm:w-56"
                        />
                      ) : track.external_url ? (
                        <a
                          href={track.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm underline"
                        >
                          Open in Spotify →
                        </a>
                      ) : (
                        <span className="text-xs text-muted">
                          No preview
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </article>
      </section>

      <section
        aria-labelledby="albums-h"
        className="space-y-4"
      >
        <h2
          id="albums-h"
          className="text-2xl font-semibold"
        >
          Top albums
        </h2>

        {topAlbums.length === 0 ? (
          <p className="text-sm text-muted">
            No albums found.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {topAlbums.map((album) => {
              const spotifyId = album.ids.spotify;

              const key =
                spotifyId ??
                `${album.title}-${album.year ?? ""}`;

              const content = (
                <div
                  className="
                    group overflow-hidden rounded-2xl
                    border border-token
                    bg-[#111321]/80 backdrop-blur-sm
                    transition-transform duration-200
                    hover:-translate-y-1
                  "
                >
                  <div className="relative aspect-square overflow-hidden">
                    {album.cover ? (
                      <img
                        src={album.cover}
                        alt={`${album.title} album cover`}
                        className="
                          h-full w-full object-cover
                          transition-transform duration-300
                          group-hover:scale-105
                        "
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-white/5" />
                    )}
                  </div>

                  <div className="min-h-[84px] p-3">
                    <div
                      className="line-clamp-2 font-medium"
                      title={album.title}
                    >
                      {album.title}
                    </div>

                    {album.year && (
                      <div className="mt-1 text-xs text-muted">
                        {album.year}
                      </div>
                    )}
                  </div>
                </div>
              );

              return spotifyId ? (
                <Link
                  key={key}
                  href={`/album/${spotifyId}`}
                  aria-label={`Open album ${album.title}`}
                >
                  {content}
                </Link>
              ) : (
                <div key={key} className="opacity-70">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

