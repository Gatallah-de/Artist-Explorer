// src/app/favorites/page.tsx
"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useFavorites } from "@/components/useFavorites";
import UnfavButton from "@/components/UnfavButton";

const ORDER = ["artists", "albums"] as const;
type TabKey = (typeof ORDER)[number];

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

  const [tab, setTab] = useState<TabKey>("artists");
  const uid = useId();

  const tabs = useMemo(
    () => [
      { key: "artists" as const, label: "Artists", count: artists.length },
      { key: "albums" as const, label: "Albums", count: albums.length },
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

  useEffect(() => {
    if (tab === "artists" && artists.length === 0 && albums.length > 0) {
      setTab("albums");
      tabRefs.current.albums?.focus();
    } else if (tab === "albums" && albums.length === 0 && artists.length > 0) {
      setTab("artists");
      tabRefs.current.artists?.focus();
    }
  }, [tab, artists.length, albums.length]);

  const onTabsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const len = ORDER.length;
    const idx = ORDER.indexOf(tab);
    if (idx < 0) return;

    const focusTab = (k: TabKey) => {
      setTab(k);
      tabRefs.current[k]?.focus();
    };

    switch (e.key) {
      case "ArrowRight": {
        e.preventDefault();
        const next = ORDER[(idx + 1) % len] as TabKey;
        focusTab(next);
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        const prev = ORDER[(idx - 1 + len) % len] as TabKey;
        focusTab(prev);
        break;
      }
      case "Home": {
        e.preventDefault();
        focusTab(ORDER[0] as TabKey);
        break;
      }
      case "End": {
        e.preventDefault();
        const last = ORDER[(len - 1) as 0 | 1] as TabKey;
        focusTab(last);
        break;
      }
    }
  };

  if (emptyAll) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Your Favorites</h1>
        <p className="text-muted">
          No favorites yet. Save an artist or an album to see it here.
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

  /* ---------- shared card pieces (match artist page "Top albums") ---------- */

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

  const Media = ({ src, alt }: { src?: string; alt: string }) => (
    <div className="relative w-full aspect-square overflow-hidden">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
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

  const Meta = ({
    title,
    secondary,
  }: {
    title: string;
    secondary?: string | number;
  }) => (
    <div className="p-3 flex flex-col gap-1 min-h-[88px]">
      <div
        className="font-medium leading-tight text-[0.95rem] line-clamp-2"
        title={title}
      >
        {title}
      </div>
      {secondary ? <div className="text-xs text-muted">{secondary}</div> : null}
    </div>
  );

  /* ---------- grids ---------- */

  const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6";

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold">Your Favorites</h1>
      </div>

      {/* Tabs */}
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
                "px-3 py-1.5 text-sm transition outline-none relative",
                selected ? "font-medium" : "hover:bg-[rgba(255,255,255,.04)]",
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

      {/* Artists */}
      <section
        role="tabpanel"
        id={`panel-artists-${uid}`}
        aria-labelledby={`tab-artists-${uid}`}
        hidden={tab !== "artists"}
        className="space-y-4"
      >
        <header className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">
            Artists <span className="text-muted font-normal">({artists.length})</span>
          </h2>
        </header>

        {artists.length === 0 ? (
          <p className="text-sm text-muted">No favorite artists yet.</p>
        ) : (
          <div className={GRID}>
            {artists.map((f) => {
              const href = f?.id ? `/artist/${encodeURIComponent(f.id)}` : undefined;
              const inner = (
                <>
                  {f.id ? (
                    <div className="absolute top-2 right-2 z-10">
                      <UnfavButton kind="artist" id={f.id} />
                    </div>
                  ) : null}
                  {/* Only pass src when defined */}
                  <Media
                    {...(f.image ? { src: f.image } : {})}
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
                  <CardFrame>{inner}</CardFrame>
                </Link>
              ) : (
                <article
                  key={`artist-${f.id ?? f.title}`}
                  aria-disabled="true"
                  tabIndex={-1}
                  className="opacity-75"
                >
                  <CardFrame>{inner}</CardFrame>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Albums */}
      <section
        role="tabpanel"
        id={`panel-albums-${uid}`}
        aria-labelledby={`tab-albums-${uid}`}
        hidden={tab !== "albums"}
        className="space-y-4"
      >
        <header className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">
            Albums <span className="text-muted font-normal">({albums.length})</span>
          </h2>
        </header>

        {albums.length === 0 ? (
          <p className="text-sm text-muted">No favorite albums yet.</p>
        ) : (
          <div className={GRID}>
            {albums.map((f) => {
              const href = f?.id ? `/album/${encodeURIComponent(f.id)}` : undefined;
              const inner = (
                <>
                  {f.id ? (
                    <div className="absolute top-2 right-2 z-10">
                      <UnfavButton kind="album" id={f.id} />
                    </div>
                  ) : null}
                  {/* Only pass src when defined */}
                  <Media
                    {...(f.image ? { src: f.image } : {})}
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
                  <CardFrame>{inner}</CardFrame>
                </Link>
              ) : (
                <article
                  key={`album-${f.id ?? f.title}`}
                  aria-disabled="true"
                  tabIndex={-1}
                  className="opacity-75"
                >
                  <CardFrame>{inner}</CardFrame>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
