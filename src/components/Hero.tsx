// src/components/Hero.tsx
"use client";

import * as React from "react";

type Kind = "start" | "center";

export type HeroProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;

  /** Background image (under a dark gradient). */
  bg?: string;

  /** Optional left thumbnail. */
  thumb?: string;

  chips?: string[];

  /** Content rendered as the fav button. */
  rightSlot?: React.ReactNode;

  size?: "sm" | "md" | "lg";
  align?: Kind;

  className?: string;
  style?: React.CSSProperties;

  /** Wrapper element (defaults to section). */
  as?: React.ElementType;

  /** Heading element (defaults to h1). */
  headingAs?: React.ElementType;

  /** If true, apply card chrome (rounded/border). */
  card?: boolean;
};

export default function Hero({
  title,
  eyebrow,
  subtitle,
  bg,
  thumb,
  chips = [],
  rightSlot,
  size = "md",
  align = "center",
  className = "",
  style,
  as: As = "section",
  headingAs: HeadingAs = "h1",
  card = true,
}: HeroProps) {
  const titleSize =
    size === "lg"
      ? "text-3xl md:text-4xl"
      : size === "sm"
        ? "text-xl"
        : "text-2xl";

  return (
    <As
      className={[
        "relative overflow-hidden",
        card ? "rounded-2xl border border-token" : "",
        "bg-[rgba(17,19,33,.75)]",
        "backdrop-blur-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-labelledby="hero-title"
    >
      {bg && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(10,11,16,.65), rgba(10,11,16,.92)), url(${bg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "saturate(105%)",
          }}
        />
      )}

      <div className="relative px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
        {rightSlot && (
          <div
            className="
              absolute top-3 right-3 md:top-4 md:right-4
              rounded-full border border-token/80
              bg-black/25 backdrop-blur
              p-1.5 shadow-sm
            "
          >
            {rightSlot}
          </div>
        )}

        <div
          className={[
            "flex flex-col gap-5 sm:flex-row md:gap-6",
            align === "center" ? "items-center" : "items-start",
          ].join(" ")}
        >
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="
                h-16 w-16 rounded-xl object-cover
                border border-token ring-1 ring-white/5
                shadow-inner
                md:h-20 md:w-20
              "
            />
          )}

          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className="mb-1.5 text-xs uppercase tracking-wide text-muted">
                {eyebrow}
              </div>
            )}

            <HeadingAs
              id="hero-title"
              className={`font-semibold leading-tight ${titleSize}`}
            >
              {title}
            </HeadingAs>

            {subtitle && (
              <p className="mt-2 max-w-3xl text-muted">
                {subtitle}
              </p>
            )}

            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <span key={chip} className="chip">
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </As>
  );
}
