// src/components/ExampleCard.tsx
"use client";

import Link from "next/link";

type Kind = "artist" | "album";

export type Props = {
  id?: string;
  name?: string;
  title?: string;
  subtitle?: string;
  href?: string;
  thumb?: string;
  kind?: Kind;
  className?: string;
};

export default function ExampleCard({
  id,
  name,
  title,
  subtitle,
  href,
  thumb,
  kind = "artist",
  className = "",
}: Props) {
  const finalTitle = title ?? name ?? "Untitled";

  const derivedHref =
    href ??
    (id
      ? `/${kind === "album" ? "album" : "artist"}/${encodeURIComponent(id)}`
      : undefined);

  const Media = () => (
    <div className="relative w-full aspect-square overflow-hidden rounded-[inherit]">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-400 ease-out will-change-transform group-hover:scale-[1.03]"
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

      {/* Soft inner vignette for contrast */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.25) 100%)",
        }}
      />
      {/* Very subtle top sheen on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(120% 60% at 30% 0%, rgba(255,255,255,.06), transparent 60%)",
        }}
      />
    </div>
  );

  const Body = (
    <>
      <Media />
      <div className="p-3">
        {/* Reserve space for up to 2 lines → stable height */}
        <div
          className="font-semibold leading-tight line-clamp-2 text-[0.98rem]"
          style={{ minHeight: "2.6em" }}
          title={finalTitle}
        >
          {finalTitle}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-xs text-muted" title={subtitle}>
            {subtitle}
          </div>
        )}
      </div>
    </>
  );

  // Unified shell: same radius/shadow as other cards, smaller hover lift.
  const base =
    [
      "group relative block overflow-hidden rounded-2xl",
      "border border-token bg-[#111321]/80 backdrop-blur-sm",
      "transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--ring),.50)]",
      // tasteful hover (reduced motion but still alive)
      "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,.28)] hover:border-fuchsia-400/30",
    ].join(" ") + (className ? ` ${className}` : "");

  const disabled = `${base} opacity-80 cursor-not-allowed`;

  return derivedHref ? (
    <Link href={derivedHref} className={base} aria-label={finalTitle}>
      {Body}
    </Link>
  ) : (
    <article className={disabled} aria-disabled="true" tabIndex={-1}>
      {Body}
    </article>
  );
}
