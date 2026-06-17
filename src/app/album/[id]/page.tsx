// src/app/album/[id]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import FavButton from "@/components/FavButton";
import Hero from "@/components/Hero";

/* ---------------- types ---------------- */
type Track = {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  preview_url?: string;
};
type Album = {
  ids: { spotify?: string };
  title: string;
  year?: number;
  cover?: string;
  url?: string;
  artists: { ids: { spotify?: string }; name: string }[];
  tracks: Track[];
};
type AlbumBundle = { album: Album };
type Credit = { role: string; name: string; mbid?: string; target?: "release" | "recording" };
type AlbumCredits = { source: "musicbrainz" | string; mbid?: string; credits: Credit[] };

/* ---------------- utils ---------------- */
function msToMin(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  return `${m}:${s}`;
}
async function absBase() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/* ---------------- metadata ---------------- */
async function getAlbumMeta(id: string) {
  const base = await absBase();
  const r = await fetch(`${base}/api/album/${id}`, { cache: "no-store" });
  if (!r.ok)
    return {
      title: "Album",
      image: undefined as string | undefined,
      year: undefined as number | undefined,
    };
  const j = (await r.json()) as AlbumBundle;
  const a = j.album;
  return { title: a?.title ?? "Album", image: a?.cover, year: a?.year };
}

type Param = { id: string };

export async function generateMetadata(
  { params }: { params: Promise<Param> }
): Promise<Metadata> {
  const { id } = await params;
  const m = await getAlbumMeta(id);
  const title = m.year ? `${m.title} (${m.year})` : m.title;
  return {
    title: `${title} — Artist Explorer`,
    description: `Tracks and details for ${title}.`,
    openGraph: {
      title: `${title} — Artist Explorer`,
      images: m.image ? [{ url: m.image }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

/* ---------------- data ---------------- */
async function getAlbumBundle(id: string): Promise<AlbumBundle> {
  const base = await absBase();
  const res = await fetch(`${base}/api/album/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) notFound();
    const msg = await res.text().catch(() => "");
    throw new Error(`Album fetch failed (${res.status}) ${msg}`.trim());
  }
  return res.json();
}
async function getCredits(id: string): Promise<AlbumCredits> {
  const base = await absBase();
  const res = await fetch(`${base}/api/album/${id}/credits`, { cache: "no-store" });
  if (!res.ok) return { source: "musicbrainz", credits: [] };
  const j = await res.json();
  return (j?.credits as AlbumCredits) ?? { source: "musicbrainz", credits: [] };
}

/* ---------------- page ---------------- */
export default async function AlbumPage(
  { params }: { params: Promise<Param> }
) {
  const { id } = await params;
  const [{ album }, credits] = await Promise.all([getAlbumBundle(id), getCredits(id)]);

  const artistNames = (album.artists ?? []).map((a) => a.name).join(" ");
  const searchTerm = encodeURIComponent(`${album.title} ${artistNames}`);
  const spotifyId = album.ids.spotify;

  return (
    <div className="space-y-12 md:space-y-14">
      {/* HERO */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-10">
        <Hero
          size="lg"
          align="start"
          title={album.title}
          subtitle={[
            album.year ? `Released ${album.year}` : undefined,
            (album.artists ?? []).map((a) => a.name).join(" • "),
          ]
            .filter(Boolean)
            .join(" — ")}
          chips={(album.artists ?? []).map((a) => a.name)}
          rightSlot={
            spotifyId ? (
              <FavButton
                kind="album"
                id={spotifyId}
                title={album.title}
                image={album.cover}
              />
            ) : null
          }
          {...(album.cover ? { bg: album.cover } : {})}
          {...(album.cover ? { thumb: album.cover } : {})}
        />
      </div>

      {/* External links */}
      <nav className="flex flex-wrap gap-4 text-sm w-full -mt-2" aria-label="External links">
        {album.url && (
          <a href={album.url} target="_blank" rel="noopener noreferrer" className="underline">
            Open in Spotify →
          </a>
        )}
        <a
          href={`https://rateyourmusic.com/search?searchtype=l&searchterm=${searchTerm}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          RYM search →
        </a>
        <a
          href={`https://www.discogs.com/search/?type=release&title=${encodeURIComponent(
            album.title
          )}&artist=${encodeURIComponent(album.artists?.[0]?.name ?? "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Discogs →
        </a>
      </nav>

      {/* Tracks */}
      <section aria-labelledby="tracks-heading" className="card p-6 w-full">
        <h2 id="tracks-heading" className="text-xl font-semibold mb-4">Tracks</h2>
        {album.tracks?.length ? (
          <ol className="divide-y" style={{ borderColor: "var(--card-border)" }}>
            {album.tracks.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3.5 md:py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-6 text-right text-xs text-muted">{t.track_number}</span>
                  <span className="font-medium truncate text-[0.98rem]">{t.name}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs text-muted">{msToMin(t.duration_ms)}</span>
                  {t.preview_url && (
                    <audio
                      controls
                      preload="none"
                      src={t.preview_url}
                      className="w-72 md:w-80"
                      aria-label={`Preview ${t.name}`}
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">No tracks found.</p>
        )}
      </section>

      {/* Credits */}
      <section aria-labelledby="personnel-heading" className="card p-6 w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 id="personnel-heading" className="text-lg font-semibold">Personnel</h2>
          {credits.source && (
            credits.source === "musicbrainz" && credits.mbid ? (
              <a
                href={`https://musicbrainz.org/release/${credits.mbid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="chip"
                title="View this release on MusicBrainz"
              >
                MusicBrainz
              </a>
            ) : (
              <span className="chip" title="Data source">{credits.source}</span>
            )
          )}
        </div>

        {credits.credits?.length ? (
          <ul className="grid sm:grid-cols-2 gap-2">
            {credits.credits.map((c, i) => (
              <li key={`${c.role}-${c.name}-${i}`} className="text-sm">
                <span className="font-medium capitalize">{c.role}</span>
                <span className="mx-2 text-muted">•</span>
                <span>{c.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            No personnel data available for this album. Data may be incomplete or out of date.
          </p>
        )}
      </section>
    </div>
  );
}
