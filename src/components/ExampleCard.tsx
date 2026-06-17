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

  const cardClasses = [
    "group relative block overflow-hidden",
    "rounded-2xl border border-token",
    "bg-[#111321]/80 backdrop-blur-sm",
    "min-h-[240px]",
    "transition-all duration-300 ease-out",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-[rgba(var(--ring),0.5)]",
    "hover:border-fuchsia-400/30",
    "hover:shadow-[0_10px_28px_rgba(0,0,0,.30)]",
    "md:hover:-translate-y-1",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="relative aspect-square overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={finalTitle}
            loading="lazy"
            decoding="async"
            className="
              absolute inset-0 h-full w-full object-cover
              transition-transform duration-500 ease-out
              md:group-hover:scale-[1.04]
            "
          />
        ) : (
          <div
            aria-hidden
            className="
              absolute inset-0
              border border-token
              bg-[rgba(255,255,255,.04)]
            "
          />
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.28) 100%)",
          }}
        />

        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-0
            opacity-0 transition-opacity duration-300
            md:group-hover:opacity-100
          "
          style={{
            background:
              "radial-gradient(120% 60% at 30% 0%, rgba(255,255,255,.05), transparent 60%)",
          }}
        />
      </div>

      <div className="flex min-h-[88px] flex-col justify-center p-4">
        <h3
          title={finalTitle}
          className="
            line-clamp-2
            text-base font-semibold leading-tight text-fg
          "
        >
          {finalTitle}
        </h3>

        {subtitle && (
          <p
            title={subtitle}
            className="
              mt-2 line-clamp-1
              text-sm text-muted
            "
          >
            {subtitle}
          </p>
        )}
      </div>
    </>
  );

  if (!derivedHref) {
    return (
      <article
        aria-disabled="true"
        tabIndex={-1}
        className={`${cardClasses} cursor-not-allowed opacity-75`}
      >
        {content}
      </article>
    );
  }

  return (
    <Link
      href={derivedHref}
      aria-label={finalTitle}
      className={cardClasses}
    >
      {content}
    </Link>
  );
}
