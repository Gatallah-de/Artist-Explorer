
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
          {
            cache: "force-cache",
            next: { revalidate: 3600 },
          }
        );

        const j = (await r.json().catch(() => null)) as
          | { ok?: boolean; url?: string }
          | null;

        map.set(id, j?.ok ? j.url : undefined);
      } catch {
        map.set(id, undefined);
      }
    })
  );

  return (id: string) => map.get(id);
}

export default async function HomePage() {
  const examples = pickRandom(SEED_ARTISTS, 6);

  const getThumb = await fetchThumbs(
    examples.map((artist) => artist.id)
  );

  return (
    <div className="flex flex-1 flex-col space-y-10 md:space-y-16 lg:space-y-20">
      {/* HERO */}
      <section
        aria-labelledby="hero-heading"
        className="
          relative overflow-visible
          pt-6 pb-4
          text-center
          md:pt-14 md:pb-8
        "
      >
        <div
          aria-hidden
          className="
            pointer-events-none absolute left-1/2 top-0 -z-10
            h-[220px] w-[100vw]
            -translate-x-1/2
            md:h-[320px]
          "
          style={{
            background:
              "radial-gradient(900px 320px at 50% 0%, rgba(168,85,247,.10), transparent 60%)," +
              "radial-gradient(760px 320px at 50% 0%, rgba(6,182,212,.08), transparent 55%)," +
              "linear-gradient(to bottom, rgba(0,0,0,.06), transparent 45%)",
            filter: "saturate(110%) blur(1px)",
          }}
        />

        <div className="container-x relative z-10">
          <h1
            id="hero-heading"
            className="
              text-fg font-extrabold tracking-wide leading-[1.05]
              text-[clamp(2rem,8vw,3.5rem)]
            "
          >
            Find your{" "}
            <span className="relative inline-block text-gradient">
              favorite artists

              <span
                aria-hidden
                className="
                  mt-1 block h-[3px] rounded-full
                  bg-gradient-to-r
                  from-fuchsia-500/85
                  via-violet-400/85
                  to-cyan-400/85
                "
                style={{
                  boxShadow: "0 0 12px rgba(168,85,247,.28)",
                }}
              />
            </span>
          </h1>

          <p
            className="
              mx-auto mt-3 max-w-lg px-4
              text-sm text-muted
              md:text-base
            "
          >
            Discover top albums, tracks, and more — no login required.
          </p>

          {/* SEARCH */}
          <div className="mx-auto mt-6 max-w-[720px] px-2 md:mt-8 md:px-3">
            <div className="relative isolate">
              <div
                role="search"
                aria-label="Artist or album search"
                className="
                  glass rounded-2xl border border-token
                  p-3 shadow-sm
                  md:p-2
                "
              >
                <Search />
              </div>

              <div
                aria-hidden
                className="
                  pointer-events-none absolute left-1/2 top-full
                  mt-2 h-16 w-[80%]
                  -translate-x-1/2 rounded-full blur-2xl
                  md:h-24
                "
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 50%, rgba(139,92,246,.10), transparent 70%)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section
        aria-labelledby="examples-heading"
        className="relative isolate"
      >
        <div className="container-x">
          <div className="mb-4 flex items-center justify-center md:mb-6">
            <h2
              id="examples-heading"
              className="
                flex items-center gap-1
                text-sm font-semibold text-muted
                md:text-base
              "
            >
              Explore examples
              <span className="text-fuchsia-400">✦</span>
            </h2>
          </div>

          <ul
  role="list"
  className="
    examples-no-scrollbar
    flex gap-4 overflow-x-auto
    snap-x snap-mandatory
    pb-3 px-1

    md:grid
    md:grid-cols-3
    md:gap-8
    md:overflow-visible
    md:px-0
  "
>
            {examples.map((artist) => {
              const thumb = getThumb(artist.id);

              return (
                <li
                  key={artist.id}
                  role="listitem"
                  className="
                    min-w-[180px]
                    snap-center

                    sm:min-w-[200px]

                    md:min-w-0
                    md:w-full
                    md:max-w-[230px]
                    md:justify-self-center
                  "
                >
                  <ExampleCard
                    id={artist.id}
                    name={artist.name}
                    kind="artist"
                    {...(thumb ? { thumb } : {})}
                    className="h-full"
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
