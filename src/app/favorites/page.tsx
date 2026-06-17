
"use client";

import Link from "next/link";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useFavorites } from "@/components/useFavorites";
import UnfavButton from "@/components/UnfavButton";

const ORDER = ["artists", "albums"] as const;

type TabKey = (typeof ORDER)[number];

type CardFrameProps = {
  children: React.ReactNode;
};

type MediaProps = {
  src?: string;
  alt: string;
};

type MetaProps = {
  title: string;
  secondary?: string | number;
};

export default function FavoritesPage() {
  const { favs } = useFavorites();

  const artists = useMemo(
    () =>
      [...favs]
        .filter((f) => f.kind === "artist")
        .sort((a, b) => a.title.localeCompare(b.title)),
    [favs]
  );

  const albums = useMemo(
    () =>
      [...favs]
        .filter((f) => f.kind === "album")
        .sort((a, b) => a.title.localeCompare(b.title)),
    [favs]
  );

  const emptyAll = artists.length === 0 && albums.length === 0;

  const [tab, setTab] = useState<TabKey>(() => {
    if (artists.length > 0) return "artists";
    if (albums.length > 0) return "albums";
    return "artists";
  });

  const uid = useId();

  const tabs = useMemo(
    () => [
      {
        key: "artists" as const,
        label: "Artists",
        count: artists.length,
      },
      {
        key: "albums" as const,
        label: "Albums",
        count: albums.length,
      },
    ],
    [artists.length, albums.length]
  );

  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    artists: null,
    albums: null,
  });

  const setTabRef = useCallback(
    (key: TabKey) => (el: HTMLButtonElement | null) => {
      tabRefs.current[key] = el;
    },
    []
  );

  const onTabsKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>
  ) => {
    const len = ORDER.length;
    const idx = ORDER.indexOf(tab);

    if (idx === -1) return;

    const focusTab = (next: TabKey) => {
      setTab(next);
      tabRefs.current[next]?.focus();
    };

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusTab(ORDER[(idx + 1) % len]!);
        break;

      case "ArrowLeft":
        e.preventDefault();
        focusTab(ORDER[(idx - 1 + len) % len]!);
        break;

      case "Home":
        e.preventDefault();
        focusTab(ORDER[0]!);
        break;

      case "End":
        e.preventDefault();
        focusTab(ORDER[len - 1]!);
        break;
    }
  };

  if (emptyAll) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">
          Your Favorites
        </h1>

        <p className="text-muted">
          No favorites yet. Save an artist or an album to
          see it here.
        </p>

        <p className="text-sm">
          Try searching above or visit the{" "}
          <Link href="/" className="underline">
            home page
          </Link>
          .
        </p>
      </div>
    );
  }

  function CardFrame({ children }: CardFrameProps) {
    return (
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition group-hover:opacity-100"
          style={{
            boxShadow:
              "0 0 16px rgba(124,58,237,.55), 0 0 28px rgba(34,211,238,.40)",
          }}
        />

        {children}
      </div>
    );
  }

  function Media({ src, alt }: MediaProps) {
    return (
      <div className="relative aspect-square w-full overflow-hidden">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid var(--card-border)",
            }}
            aria-hidden
          />
        )}
      </div>
    );
  }

  function Meta({ title, secondary }: MetaProps) {
    return (
      <div className="flex min-h-[88px] flex-col gap-1 p-3">
        <div
          className="line-clamp-2 text-[0.95rem] font-medium leading-tight"
          title={title}
        >
          {title}
        </div>

        {secondary ? (
          <div className="text-xs text-muted">
            {secondary}
          </div>
        ) : null}
      </div>
    );
  }

  const GRID =
    "grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 md:gap-6";

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold">
          Your Favorites
        </h1>
      </div>

      <div
        role="tablist"
        aria-label="Favorite types"
        aria-orientation="horizontal"
        className="inline-flex rounded-xl border"
        style={{
          borderColor: "var(--card-border)",
          background: "rgba(17,19,33,.7)",
          backdropFilter: "blur(6px)",
        }}
        onKeyDown={onTabsKeyDown}
      >
        {tabs.map(({ key, label, count }) => {
          const selected = tab === key;

          return (
            <button
              key={key}
              ref={setTabRef(key)}
              type="button"
              role="tab"
              id={`tab-${key}-${uid}`}
              aria-selected={selected}
              aria-controls={`panel-${key}-${uid}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(key)}
              className={[
                "relative px-3 py-1.5 text-sm outline-none transition",
                selected
                  ? "font-medium"
                  : "hover:bg-[rgba(255,255,255,.04)]",
                "focus-visible:ring-2",
              ].join(" ")}
              style={{
                boxShadow: selected
                  ? "inset 0 -2px 0 rgba(124,58,237,.6)"
                  : undefined,
              }}
            >
              {label} {count ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      <section
        role="tabpanel"
        id={`panel-artists-${uid}`}
        aria-labelledby={`tab-artists-${uid}`}
        hidden={tab !== "artists"}
        className="space-y-4"
      >
        <header className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">
            Artists{" "}
            <span className="font-normal text-muted">
              ({artists.length})
            </span>
          </h2>
        </header>

        {artists.length === 0 ? (
          <p className="text-sm text-muted">
            No favorite artists yet.
          </p>
        ) : (
          <div className={GRID}>
            {artists.map((f) => {
              const href = f.id
                ? `/artist/${encodeURIComponent(f.id)}`
                : undefined;

              const content = (
                <>
                  {f.id && (
                    <div className="absolute right-2 top-2 z-10">
                      <UnfavButton
                        kind="artist"
                        id={f.id}
                      />
                    </div>
                  )}

                  <Media
                    src={f.image}
                    alt={`${f.title} — artist photo`}
                  />

                  <Meta title={f.title} />
                </>
              );

              return href ? (
                <Link
                  key={`artist-${f.id ?? f.title}`}
                  href={href}
                  aria-label={`Open artist ${f.title}`}
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--ring),.45)]"
                >
                  <CardFrame>{content}</CardFrame>
                </Link>
              ) : (
                <article
                  key={`artist-${f.id ?? f.title}`}
                  aria-disabled="true"
                  tabIndex={-1}
                  className="opacity-75"
                >
                  <CardFrame>{content}</CardFrame>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        role="tabpanel"
        id={`panel-albums-${uid}`}
        aria-labelledby={`tab-albums-${uid}`}
        hidden={tab !== "albums"}
        className="space-y-4"
      >
        <header className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">
            Albums{" "}
            <span className="font-normal text-muted">
              ({albums.length})
            </span>
          </h2>
        </header>

        {albums.length === 0 ? (
          <p className="text-sm text-muted">
            No favorite albums yet.
          </p>
        ) : (
          <div className={GRID}>
            {albums.map((f) => {
              const href = f.id
                ? `/album/${encodeURIComponent(f.id)}`
                : undefined;

              const content = (
                <>
                  {f.id && (
                    <div className="absolute right-2 top-2 z-10">
                      <UnfavButton
                        kind="album"
                        id={f.id}
                      />
                    </div>
                  )}

                  <Media
                    src={f.image}
                    alt={`${f.title} — album cover`}
                  />

                  <Meta title={f.title} />
                </>
              );

              return href ? (
                <Link
                  key={`album-${f.id ?? f.title}`}
                  href={href}
                  aria-label={`Open album ${f.title}`}
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--ring),.45)]"
                >
                  <CardFrame>{content}</CardFrame>
                </Link>
              ) : (
                <article
                  key={`album-${f.id ?? f.title}`}
                  aria-disabled="true"
                  tabIndex={-1}
                  className="opacity-75"
                >
                  <CardFrame>{content}</CardFrame>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
