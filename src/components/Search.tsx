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
    <div ref={boxRef} className="relative z-[60]">
      {/* Search input + segmented control */}
      <div className="relative">
        <input
          className="input pr-28"
          placeholder={`Search ${mode === "artists" ? "artists" : "albums"}…`}
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setSelIdx(-1);
            debounced(v, mode);
          }}
          onFocus={() => { if (display.length) setOpen(true); }}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-list"
          role="combobox"
        />

        {/* Segmented toggle */}
        <div
          role="tablist"
          aria-label="Search category"
          className="
            absolute top-1/2 -translate-y-1/2 right-2
            inline-flex items-center gap-1
            bg-[rgba(255,255,255,.06)] border border-token rounded-md
            p-[2px] text-[11px] select-none
          "
        >
          <button
            role="tab"
            aria-selected={mode === "artists"}
            onClick={() => setMode("artists")}
            className={[
              "px-2 py-1 rounded-sm transition",
              mode === "artists"
                ? "bg-[rgba(124,58,237,.25)] text-white"
                : "text-muted hover:text-fg",
            ].join(" ")}
            type="button"
            tabIndex={-1}
          >
            Artists
          </button>
          <button
            role="tab"
            aria-selected={mode === "albums"}
            onClick={() => setMode("albums")}
            className={[
              "px-2 py-1 rounded-sm transition",
              mode === "albums"
                ? "bg-[rgba(34,211,238,.22)] text-white"
                : "text-muted hover:text-fg",
            ].join(" ")}
            type="button"
            tabIndex={-1}
          >
            Albums
          </button>
        </div>
      </div>

      {(open || loading) && (
        <div
          id="search-list"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()} /* keep input focus */
          className="search-panel absolute left-0 right-0 mt-2 rounded-xl border border-token shadow-xl z-[999] bg-[#0e1120]"
          style={{ overflow: "hidden" }}
        >
          {/* Header */}
          <div className="px-3 pt-3 text-[11px] tracking-wide text-muted">
            {mode === "artists" ? "ARTISTS" : "ALBUMS"}
          </div>

          {/* List */}
          <div className="p-3 pt-2 overflow-auto">
            {loading && (
              <div className="px-2 py-1 text-sm text-muted">Searching…</div>
            )}
            {!loading && display.length === 0 && (
              <div className="px-2 py-1 text-sm text-muted">No results.</div>
            )}

            <div className="flex flex-col gap-1 pr-1">
              {display.map((row, i) => {
                const isActive = i === selIdx;
                return (
                  <div
                    key={`${row.type}-${row.id}`}
                    id={`opt-${i}`}
                    role="option"
                    aria-selected={isActive}
                    className={[
                      "result-row flex items-start gap-3 px-2 cursor-pointer rounded-[10px]",
                      isActive
                        ? "bg-[rgba(124,58,237,.14)] shadow-[inset_0_0_0_1px_rgba(124,58,237,.25)]"
                        : "hover:bg-[rgba(124,58,237,.10)]",
                    ].join(" ")}
                    onMouseEnter={() => setSelIdx(i)}
                    onClick={() => go(row)}
                  >
                    {/* Thumbnail */}
                    <div
                      className="row-thumb mt-1 shrink-0"
                      style={{ width: 40, height: 40, borderRadius: 8 }}
                    >
                      {"image" in row && row.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.image}
                          alt=""
                          className="block w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>

                    <div className="row-main min-w-0 py-2">
                      <div className="row-title">{row.title}</div>
                      {"subtitle" in row && row.subtitle && (
                        <div className="row-sub">{row.subtitle}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
