"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type FavKind = "artist" | "album";
export type FavItem = {
  kind: FavKind;
  id: string;
  title: string;
  image?: string | undefined; // explicit undefined for exactOptionalPropertyTypes
};

type Ctx = {
  favs: FavItem[];
  add: (item: FavItem) => void;
  remove: (kind: FavKind, id: string) => void;
  toggle: (item: FavItem) => void;
  isFav: (kind: FavKind, id: string) => boolean;
  clear: () => void;
};

const STORAGE_KEY = "ae:favorites:v1";

function isFavItem(x: any): x is FavItem {
  return (
    x &&
    (x.kind === "artist" || x.kind === "album") &&
    typeof x.id === "string" &&
    typeof x.title === "string"
  );
}

function loadFromStorage(): FavItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isFavItem) : [];
  } catch {
    return [];
  }
}
function saveToStorage(items: FavItem[]) {
  if (typeof window === "undefined") return;
  try {
    // JSON.stringify omits undefined fields, which is fine
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

const FavoritesCtx = createContext<Ctx | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favs, setFavs] = useState<FavItem[]>([]);
  const initialised = useRef(false);

  // Initial load
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    setFavs(loadFromStorage());
  }, []);

  // Persist changes
  useEffect(() => {
    if (initialised.current) saveToStorage(favs);
  }, [favs]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavs(loadFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFav = useCallback(
    (kind: FavKind, id: string) => favs.some((f) => f.kind === kind && f.id === id),
    [favs]
  );

  const add = useCallback((item: FavItem) => {
    if (!item?.id || !item?.kind) return;
    setFavs((prev) =>
      prev.some((f) => f.kind === item.kind && f.id === item.id) ? prev : [...prev, item]
    );
  }, []);

  const remove = useCallback((kind: FavKind, id: string) => {
    setFavs((prev) => prev.filter((f) => !(f.kind === kind && f.id === id)));
  }, []);

  const toggle = useCallback((item: FavItem) => {
    setFavs((prev) =>
      prev.some((f) => f.kind === item.kind && f.id === item.id)
        ? prev.filter((f) => !(f.kind === item.kind && f.id === item.id))
        : [...prev, item]
    );
  }, []);

  const clear = useCallback(() => setFavs([]), []);

  const value = useMemo<Ctx>(
    () => ({ favs, add, remove, toggle, isFav, clear }),
    [favs, add, remove, toggle, isFav, clear]
  );

  return <FavoritesCtx.Provider value={value}>{children}</FavoritesCtx.Provider>;
}

export function useFavorites(): Ctx {
  const ctx = useContext(FavoritesCtx);
  if (!ctx) throw new Error("useFavorites must be used within <FavoritesProvider>");
  return ctx;
}
