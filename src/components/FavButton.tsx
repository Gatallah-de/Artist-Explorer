"use client";

import { useFavorites } from "@/components/useFavorites";

export type FavButtonProps = {
  kind: "artist" | "album";
  id: string;
  title: string;
  image?: string | undefined; // ← allow undefined explicitly
};

export default function FavButton({ kind, id, title, image }: FavButtonProps) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(kind, id);

  return (
    <button
      type="button"
      onClick={() => toggle({ kind, id, title, image })}
      className={[
        "rounded-full p-2 transition-colors",
        fav
          ? "bg-[rgba(124,58,237,.15)] text-[var(--accent)]"
          : "bg-[rgba(255,255,255,.04)] text-muted hover:text-[var(--accent)]",
      ].join(" ")}
      title={fav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={fav}
    >
      {fav ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 20 20">
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.239-4.5-5-4.5-1.657 0-3.094.795-4 2.016C11.094 4.545 9.657 3.75 8 3.75c-2.761 0-5 2.015-5 4.5 0 5.25 9 12 9 12s9-6.75 9-12z"/>
        </svg>
      )}
    </button>
  );
}
