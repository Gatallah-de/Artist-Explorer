// src/components/Search.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ---------- API shapes ---------- */
type ArtistAPIItem = {
  id: { spotify: string };
  name: string;
  images?: { url?: string }[];
};
type AlbumAPIItem = {
  id: string;
  title: string;
  year?: number;
  image?: string;
  artist?: string;
};

/* ---------- Internal rows ---------- */
type ArtistRow = { type: "artist"; id: string; title: string; image?: string };
type AlbumRow  = { type: "album";  id: string; title: string; image?: string; subtitle?: string };
type Row = ArtistRow | AlbumRow;
type Mode = "artists" | "albums";

const MAX_RESULTS = 3;
const DEBOUNCE_MS = 250;

export default function Search() {
  const router = useRouter();

  /* UI state */
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("artists");
  const [selIdx, setSelIdx] = useState(-1);

  /* Results */
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [albums,  setAlbums]  = useState<AlbumRow[]>([]);

  /* Refs */
  const boxRef   = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  /* ---------- Fetch per-mode (hard-capped to MAX_RESULTS) ---------- */
  const runSearch = useCallback(async (val: string, m: Mode) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setLoading(true);

    try {
      if (m === "artists") {
        const r = await fetch(
          `/api/search/artists?q=${encodeURIComponent(val)}&limit=${MAX_RESULTS}`,
          { cache: "no-store", signal }
        );
        const j = await r.json();
        const items: ArtistAPIItem[] = Array.isArray(j?.items) ? j.items : [];

        const rows: ArtistRow[] = items.slice(0, MAX_RESULTS).map((x) => {
          const img = x.images?.[0]?.url;
          return {
            type: "artist",
            id: x.id.spotify,
            title: x.name,
            ...(img ? { image: img } : {}),
          };
        });

        setArtists(rows);
        setAlbums([]); // clear the other list
        setOpen(rows.length > 0);
        setSelIdx(rows.length > 0 ? 0 : -1);
      } else {
        const r = await fetch(
          `/api/search/albums?q=${encodeURIComponent(val)}&limit=${MAX_RESULTS}`,
          { cache: "no-store", signal }
        );
        const j = await r.json();
        const items: AlbumAPIItem[] = Array.isArray(j?.items) ? j.items : [];

        const rows: AlbumRow[] = items.slice(0, MAX_RESULTS).map((x) => {
          const img = x.image;
          return {
            type: "album",
            id: x.id,
            title: x.title,
            ...(img ? { image: img } : {}),
            subtitle: [x.artist, x.year].filter(Boolean).join(" • "),
          };
        });

        setAlbums(rows);
        setArtists([]); // clear the other list
        setOpen(rows.length > 0);
        setSelIdx(rows.length > 0 ? 0 : -1);
      }
    } catch {
      // reset on error
      setArtists([]);
      setAlbums([]);
      setOpen(false);
      setSelIdx(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------- Debounced runner ---------- */
  const debounced = useMemo(
    () => (val: string, m: Mode) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (!val.trim()) {
          setArtists([]); setAlbums([]);
          setOpen(false); setSelIdx(-1);
          if (abortRef.current) abortRef.current.abort();
          return;
        }
        runSearch(val, m);
      }, DEBOUNCE_MS);
    },
    [runSearch]
  );

  /* Close when clicking outside */
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  /* Re-run when the mode switches (keep the same query) */
  useEffect(() => {
    if (q.trim()) debounced(q, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* Display list based on mode (already MAX_RESULTS capped) */
  const display: Row[] = useMemo(
    () => (mode === "artists" ? artists : albums),
    [mode, artists, albums]
  );

  const go = useCallback(
    (row: Row) => {
      if (row.type === "artist") router.push(`/artist/${encodeURIComponent(row.id)}`);
      else router.push(`/album/${encodeURIComponent(row.id)}`);
      setOpen(false);
    },
    [router]
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setSelIdx(-1);
      return;
    }
    if (!open || display.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelIdx((i) => (i < 0 ? 0 : Math.min(i + 1, display.length - 1)));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && selIdx >= 0) {
      const row = display[selIdx];
      if (row) go(row);
    }
  }

  /* ---------- Render ---------- */
return (
  <div ref={boxRef} className="relative z-[60] w-full max-w-2xl mx-auto">
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <input
          className="
            input
            w-full
            h-12 md:h-11
            px-4
            text-base md:text-sm
          "
          placeholder={`Search ${mode === "artists" ? "artists" : "albums"}…`}
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setSelIdx(-1);
            debounced(v, mode);
          }}
          onFocus={() => {
            if (display.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-list"
          role="combobox"
        />
      </div>

      {/* Segmented toggle */}
      <div
        role="tablist"
        aria-label="Search category"
        className="
          flex
          w-full
          rounded-xl
          border border-token
          bg-[rgba(255,255,255,.04)]
          p-1
        "
      >
        <button
          role="tab"
          aria-selected={mode === "artists"}
          onClick={() => setMode("artists")}
          type="button"
          className={[
            "flex-1",
            "min-h-[44px]",
            "rounded-lg",
            "text-sm",
            "font-medium",
            "transition",
            mode === "artists"
              ? "bg-[rgba(124,58,237,.25)] text-white"
              : "text-muted hover:text-fg",
          ].join(" ")}
        >
          Artists
        </button>

        <button
          role="tab"
          aria-selected={mode === "albums"}
          onClick={() => setMode("albums")}
          type="button"
          className={[
            "flex-1",
            "min-h-[44px]",
            "rounded-lg",
            "text-sm",
            "font-medium",
            "transition",
            mode === "albums"
              ? "bg-[rgba(34,211,238,.22)] text-white"
              : "text-muted hover:text-fg",
          ].join(" ")}
        >
          Albums
        </button>
      </div>
    </div>

    {(open || loading) && (
      <div
        id="search-list"
        role="listbox"
        onMouseDown={(e) => e.preventDefault()}
        className="
          search-panel
          absolute
          left-0
          right-0
          mt-3
          overflow-hidden
          rounded-2xl
          border border-token
          bg-[#0e1120]
          shadow-xl
          z-[999]
          max-h-[70vh]
          md:max-h-[420px]
        "
      >
        <div className="px-4 pt-4 text-xs tracking-wide text-muted">
          {mode === "artists" ? "ARTISTS" : "ALBUMS"}
        </div>

        <div className="overflow-y-auto p-3">
          {loading && (
            <div className="px-3 py-3 text-sm text-muted">
              Searching…
            </div>
          )}

          {!loading && display.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted">
              No results.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {display.map((row, i) => {
              const isActive = i === selIdx;

              return (
                <button
                  key={`${row.type}-${row.id}`}
                  id={`opt-${i}`}
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  onMouseEnter={() => setSelIdx(i)}
                  onClick={() => go(row)}
                  className={[
                    "flex",
                    "w-full",
                    "items-center",
                    "gap-3",
                    "rounded-xl",
                    "px-3",
                    "py-3",
                    "text-left",
                    "transition",
                    isActive
                      ? "bg-[rgba(124,58,237,.14)] shadow-[inset_0_0_0_1px_rgba(124,58,237,.25)]"
                      : "hover:bg-[rgba(124,58,237,.10)]",
                  ].join(" ")}
                >
                  <div
                    className="shrink-0 overflow-hidden rounded-lg"
                    style={{ width: 48, height: 48 }}
                  >
                    {"image" in row && row.image && (
                      <img
                        src={row.image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {row.title}
                    </div>

                    {"subtitle" in row && row.subtitle && (
                      <div className="mt-1 truncate text-xs text-muted">
                        {row.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </div>
);
}
