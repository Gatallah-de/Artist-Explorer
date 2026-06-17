// src/hooks/useArtistThumbs.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ThumbMap = Record<string, string | undefined>;

export function useArtistThumbs(ids: Array<string | undefined | null>) {
  // Deduplicate + drop falsy
  const uniqueIds = useMemo(
    () => Array.from(new Set(ids.filter((x): x is string => !!x))),
    [ids]
  );

  const [data, setData] = useState<ThumbMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (uniqueIds.length === 0) {
      setData({});
      setLoading(false);
      setError(undefined);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    async function run() {
      try {
        setLoading(true);
        setError(undefined);

        const base =
          (typeof window !== "undefined"
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") ?? "";

        const results = await Promise.allSettled(
          uniqueIds.map(async (id) => {
            const r = await fetch(
              `${base}/api/artist-image?id=${encodeURIComponent(id)}`,
              { signal: ctrl.signal, cache: "force-cache" }
            );
            const j = (await r.json().catch(() => null)) as
              | { ok?: boolean; url?: string }
              | null;
            return [id, j?.ok ? j.url : undefined] as const;
          })
        );

        if (cancelled || !mounted.current) return;

        const next: ThumbMap = {};
        for (const res of results) {
          if (res.status === "fulfilled") {
            const [id, url] = res.value;
            next[id] = url;
          } else {
            // Leave undefined on failure
          }
        }
        setData(next);
      } catch (e: any) {
        if (cancelled || !mounted.current) return;
        if (e?.name !== "AbortError") setError(String(e?.message || e));
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [uniqueIds]);

  const get = (id: string | undefined | null) =>
    id ? data[id] : undefined;

  return { get, data, loading, error };
}

export default useArtistThumbs;
