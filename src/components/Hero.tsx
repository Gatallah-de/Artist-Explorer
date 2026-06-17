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
  as?: keyof JSX.IntrinsicElements;

  /** Heading element (defaults to h1). */
  headingAs?: keyof JSX.IntrinsicElements;

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
    size === "lg" ? "text-3xl md:text-4xl" : size === "sm" ? "text-xl" : "text-2xl";

  return (
    <As
      className={[
        "relative overflow-hidden",
        card ? "rounded-2xl border border-token" : "",
        "bg-[rgba(17,19,33,.75)]", // soft glass
        "backdrop-blur-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-labelledby="hero-title"
    >
      {/* BG + veil */}
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

      {/* CONTENT (adds inset padding so edges never hug) */}
      <div
        className={[
          "relative",
          "px-4 sm:px-6 md:px-8", // ← horizontal inset
          "py-4 sm:py-5 md:py-6", // ← vertical inset
        ].join(" ")}
      >
        {/* Floating right action (fav) with safe margins */}
        {rightSlot ? (
          <div
            className="
              absolute top-3 right-3 md:top-4 md:right-4
              rounded-full border border-token/80 bg-black/25 backdrop-blur
              p-1.5 shadow-sm
            "
          >
            {rightSlot}
          </div>
        ) : null}

        <div
          className={[
            "flex gap-5 md:gap-6",
            "flex-col sm:flex-row",
            align === "center" ? "items-center" : "items-start",
          ].join(" ")}
        >
          {/* Left thumb with a little breathing room */}
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="
                w-16 h-16 md:w-20 md:h-20
                object-cover rounded-xl
                ring-1 ring-white/5 border border-token
                shadow-inner
              "
            />
          )}

          {/* Text block */}
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <div className="text-xs uppercase tracking-wide text-muted mb-1.5">
                {eyebrow}
              </div>
            )}

            <HeadingAs id="hero-title" className={`font-semibold leading-tight ${titleSize}`}>
              {title}
            </HeadingAs>

            {subtitle && <p className="text-muted mt-2 max-w-3xl">{subtitle}</p>}

            {!!chips.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <span key={c} className="chip">
                    {c}
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
