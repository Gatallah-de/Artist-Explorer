"use client";

import { useFavorites } from "@/components/useFavorites";

type Props = {
  kind: "artist" | "album";
  id: string;
};

export default function UnfavButton({ kind, id }: Props) {
  const { remove } = useFavorites();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault(); // don’t trigger Link navigation
        e.stopPropagation();
        remove(kind, id);
      }}
      title="Remove from favorites"
      aria-label="Remove from favorites"
      className="absolute top-2 right-2 z-10 rounded-full p-1.5 
                 bg-[rgba(0,0,0,0.55)] hover:bg-[rgba(0,0,0,0.75)]
                 text-muted hover:text-[var(--accent)]
                 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
