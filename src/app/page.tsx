// src/app/page.tsx
import Search from "@/components/Search";
import ExampleCard from "@/components/ExampleCard";
import { SEED_ARTISTS } from "@/data/seedArtists";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pickRandom<T>(arr: readonly T[], n: number): T[] {
  const a = arr.slice();
  const count = Math.max(0, Math.min(n, a.length));
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (a.length - i));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, count);
}

async function absBase() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

async function fetchThumbs(ids: string[]) {
  const base = await absBase();
  const unique = Array.from(new Set(ids)).filter(Boolean);
  const map = new Map<string, string | undefined>();

  await Promise.all(
    unique.map(async (id) => {
      try {
        const r = await fetch(
          `${base}/api/artist-image?id=${encodeURIComponent(id)}`,
          { cache: "force-cache", next: { revalidate: 3600 } }
        );
        const j = (await r.json().catch(() => null)) as
          | { ok?: boolean; url?: string }
          | null;
        map.set(id, j?.ok ? (j.url as string | undefined) : undefined);
      } catch {
        map.set(id, undefined);
      }
    })
  );

  return (id: string) => map.get(id);
}

export default async function HomePage() {
  const examples = pickRandom(SEED_ARTISTS, 3);
  const getThumb = await fetchThumbs(examples.map((e) => e.id));

  return (
    <div className="flex flex-col flex-1 space-y-14 md:space-y-18 lg:space-y-20">
      {/* HERO */}
      <section
        className="relative text-center pt-12 md:pt-16 pb-6 md:pb-8 overflow-visible"
        aria-labelledby="hero-heading"
      >
        <div
          aria-hidden
          className="
            pointer-events-none absolute left-1/2 top-0 -z-10
            w-[100vw] -translate-x-1/2 h-[min(42vh,360px)]
          "
          style={{
            background:
              "radial-gradient(900px 320px at 50% 0%, rgba(168,85,247,.14), transparent 60%)," +
              "radial-gradient(760px 320px at 50% 0%, rgba(6,182,212,.12), transparent 55%)," +
              "linear-gradient(to bottom, rgba(0,0,0,.10), transparent 45%)",
            filter: "saturate(115%) blur(1.5px)",
          }}
        />

        <div className="container-x hero-stage z-[2000]">
          <h1
            id="hero-heading"
            className="
              font-extrabold tracking-wide text-fg
              text-[clamp(2rem,5.2vw,3.5rem)]
              leading-[1.05]
            "
          >
            Find your{" "}
            <span className="relative inline-block text-gradient">
              favorite artists
              <span
                aria-hidden
                className="block h-[3px] mt-1 rounded-full bg-gradient-to-r from-fuchsia-500/85 via-violet-400/85 to-cyan-400/85"
                style={{ boxShadow: "0 0 12px rgba(168,85,247,.38)" }}
              />
            </span>
          </h1>

          <p className="mt-2 text-[clamp(.95rem,1vw,1rem)] text-muted max-w-xl mx-auto">
            Discover top albums, tracks, and more — no login required.
          </p>

          {/* Search */}
          <div className="mt-8 sm:mt-10 max-w-[720px] mx-auto px-3">
            <div className="relative isolate z-[2100]">
              <div
                className="
                  relative glass rounded-lg border border-token
                  shadow-sm p-2
                "
                role="search"
                aria-label="Artist or album search"
              >
                <Search />
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-3 h-24 w-[80%] rounded-full blur-2xl"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 50%, rgba(139,92,246,.12), transparent 70%)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section
        aria-labelledby="examples-heading"
        className="relative z-0 w-full isolate examples-no-rails"
      >
        <div className="container-x">
          <div className="flex items-center justify-center mb-6">
            <h2
              id="examples-heading"
              className="text-sm md:text-base font-semibold text-muted flex items-center gap-1"
            >
              Explore examples <span className="text-fuchsia-400">✦</span>
            </h2>
          </div>

          <ul
            role="list"
            className="
              tiles-clean list-none
              grid gap-8 md:gap-10
              justify-items-center
              mx-auto
              px-2
            "
            style={{
              maxWidth: 1100, // give the row more room on wide screens
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", // bigger tiles
            }}
          >
            {examples.map((artist) => {
              const t = getThumb(artist.id);
              return (
                <li key={artist.id} role="listitem" className="w-full max-w-[230px]">
                  <ExampleCard
                    id={artist.id}
                    name={artist.name}
                    kind="artist"
                    {...(t ? { thumb: t } : {})}
                    className="
                      transition-transform duration-200 ease-[cubic-bezier(.25,.1,.25,1)] will-change-transform
                      hover:-translate-y-0.5
                      hover:shadow-[0_12px_36px_rgba(124,58,237,.18),0_10px_24px_rgba(34,211,238,.12)]
                      hover:border-fuchsia-400/30
                      focus-visible:shadow-[0_0_0_2px_rgba(124,58,237,.45)]
                    "
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
