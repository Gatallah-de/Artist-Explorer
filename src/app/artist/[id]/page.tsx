// src/app/artist/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import * as React from "react";
import Hero from "@/components/Hero";
import FavButton from "@/components/FavButton";

/* ------------ Types ------------ */
type Img = { url: string; width?: number; height?: number };
type Artist = { name: string; genres?: string[]; images?: Img[] };
type Album = { ids: { spotify?: string }; title: string; year?: number; cover?: string };
type WikiBio = { title: string; extract?: string; content_urls?: { desktop?: { page: string } } };
type Track = { id: string; name: string; duration_ms: number; preview_url?: string; external_url?: string };
type ArtistBundle = { artist: Artist; topAlbums: Album[]; topTracks?: Track[]; bio?: WikiBio | null };

/* ------------ Helpers ------------ */
async function absBase() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
function msToMin(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function truncate(text: string | undefined, max = 220) {
  if (!text) return undefined;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}
function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/* ------------ Metadata ------------ */
async function getArtistMeta(id: string) {
  const base = await absBase();
  const r = await fetch(`${base}/api/artist/${id}`, { cache: "no-store" });
  if (!r.ok) {
    return { title: "Artist Explorer", desc: "Artist details", image: undefined as string | undefined };
  }
  const j = (await r.json()) as ArtistBundle;
  const title = j?.artist?.name ?? "Artist Explorer";
  const image = j?.artist?.images?.[0]?.url as string | undefined;
  const desc = (j?.bio?.extract as string | undefined) ?? `Top tracks and albums for ${title}.`;
  return { title, image, desc };
}

type Param = { id: string };

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

/* ------------ Data ------------ */
async function getArtistBundle(id: string): Promise<ArtistBundle> {
  const base = await absBase();
  const res = await fetch(`${base}/api/artist/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) notFound();
    const msg = await res.text().catch(() => "");
    throw new Error(`Artist fetch failed (${res.status}) ${msg}`.trim());
  }
  return res.json() as Promise<ArtistBundle>;
}

/* ------------ Page ------------ */
export default async function ArtistPage(
  { params }: { params: Promise<Param> }
) {
  const { id } = await params;
  const { artist, topAlbums, bio, topTracks = [] } = await getArtistBundle(id);

  const heroUrl = artist.images?.[0]?.url ?? undefined;
  const genres = dedupe(artist.genres ?? []).slice(0, 5);

 return (
  <div className="space-y-10 md:space-y-12 lg:space-y-16">
    {/* HERO */}
    <Hero
  size="lg"
  align="start"
  title={artist.name}
  subtitle={truncate(bio?.extract ?? "", 240) || ""} // always a string
  chips={genres}
  rightSlot={
    <FavButton
      kind="artist"
      id={id}
      title={artist.name}
      image={heroUrl}
    />
  }
  {...(heroUrl ? { bg: heroUrl, thumb: heroUrl } : {})}
/>

      {/* About + Top tracks */}
      <section className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* About */}
        <article className="card h-full flex flex-col" aria-labelledby="about-h">
          <h2 id="about-h" className="text-xl font-semibold mb-2.5 px-6 pt-6">About</h2>
          <div className="px-6 pb-6">
            {bio?.extract ? (
              <>
                <p className="text-[0.95rem] text-muted leading-relaxed">{bio.extract}</p>
                {bio.content_urls?.desktop?.page && (
                  <a
                    className="text-sm underline mt-3 inline-block"
                    href={bio.content_urls.desktop.page}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read more on Wikipedia →
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">Biography unavailable.</p>
            )}
          </div>
          <div className="mt-auto" />
        </article>

        {/* Top tracks */}
        <article className="card h-full flex flex-col" aria-labelledby="tracks-h">
          <header className="px-6 pt-6">
            <h2 id="tracks-h" className="text-2xl font-semibold">Top tracks</h2>
          </header>

          {topTracks.length === 0 ? (
            <div className="px-6 pb-6">
              <p className="text-sm text-muted mt-3">No top tracks available.</p>
            </div>
          ) : (
            <ol className="mt-3 flex-1 overflow-hidden divide-y" style={{ borderColor: "var(--card-border)" }}>
              {topTracks.slice(0, 10).map((t, idx) => {
                const hasPreview = Boolean(t.preview_url);
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 md:py-4 transition-colors"
                  >
                    {/* Left: index + title */}
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-6 text-right text-xs text-muted tabular-nums">
                        {idx + 1}
                      </span>

                      {hasPreview ? (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted)" }}>
                          <polygon fill="currentColor" points="8,5 19,12 8,19" />
                        </svg>
                      ) : (
                        <span className="w-4 h-4" aria-hidden="true" />
                      )}

                      <span className="font-medium truncate text-[0.98rem]">{t.name}</span>
                    </div>

                    {/* Right: duration + preview/external */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-xs text-muted tabular-nums">{msToMin(t.duration_ms)}</span>

                      {hasPreview ? (
                        <audio
                          className="w-60 sm:w-64 md:w-72 lg:w-80"
                          controls
                          preload="none"
                          src={t.preview_url}
                          aria-label={`Preview ${t.name}`}
                        />
                      ) : t.external_url ? (
                        <a
                          href={t.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline"
                          title="Open in Spotify"
                          aria-label={`Open ${t.name} on Spotify`}
                        >
                          Open in Spotify →
                        </a>
                      ) : (
                        <span className="text-xs text-muted" title="No preview available">
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
{/* ---------- Top albums ---------- */}
<section aria-labelledby="albums-h" className="space-y-4">
  <header className="flex items-end justify-between">
    <h2 id="albums-h" className="text-2xl font-semibold">Top albums</h2>
  </header>

  {topAlbums?.length === 0 ? (
    <p className="text-sm text-muted">No albums found.</p>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6">
      {topAlbums.map((a) => {
        const spotifyId = a.ids.spotify;
        const key = spotifyId ?? `${a.title}-${a.year ?? ""}`;

        const CardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
          <div
            className={[
              "group relative overflow-hidden rounded-2xl",
              "border border-token bg-[#111321]/80 backdrop-blur-sm",
              "transition will-change-transform",
              "hover:-translate-y-1 focus-within:-translate-y-1",
              "focus-within:ring-2 focus-within:ring-[rgba(var(--ring),.45)]",
              "shadow-[0_6px_18px_rgba(0,0,0,.18)]",
            ].join(" ")}
          >
            {/* Neon border glow only */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition group-hover:opacity-100"
              style={{
                boxShadow: "0 0 16px rgba(124,58,237,.55), 0 0 28px rgba(34,211,238,.40)",
              }}
            />
            {children}
          </div>
        );

        const Media = (
          <div className="relative w-full aspect-square overflow-hidden">
            {a.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.cover}
                alt={`${a.title} — album cover`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--card-border)" }}
                aria-hidden
              />
            )}
          </div>
        );

        // Taller, fixed meta so two lines + year never clip
        const Meta = (
          <div className="p-3 flex flex-col gap-1 min-h-[88px]">
            <div
              className="font-medium leading-tight text-[0.95rem] line-clamp-2"
              title={a.title}
            >
              {a.title}
            </div>
            {a.year && <div className="text-xs text-muted">{a.year}</div>}
          </div>
        );

        const CardInner = (
          <>
            {Media}
            {Meta}
          </>
        );

        return spotifyId ? (
          <Link
            key={key}
            href={`/album/${spotifyId}`}
            aria-label={`Open album ${a.title}`}
            className="block outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--ring),.45)]"
          >
            <CardFrame>{CardInner}</CardFrame>
          </Link>
        ) : (
          <article
            key={key}
            aria-disabled="true"
            tabIndex={-1}
            className="opacity-75"
          >
            <CardFrame>{CardInner}</CardFrame>
          </article>
        );
      })}
    </div>
  )}
</section>

    </div>
  );
}
