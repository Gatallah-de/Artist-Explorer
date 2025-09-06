// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/favorites", label: "Favorites" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header
      className="site-header relative"
      role="banner"
      aria-label="Primary"
      // Soften the global header blur without touching globals.css
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      {/* Soft wash only (no hard glow shapes) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-transparent"
      />

      <div className="site-header-inner">
        {/* Brand */}
        <Link
          href="/"
          className="brand flex items-center gap-2 select-none"
          aria-label="Artist Explorer — Home"
        >
          {/* Clean, compact mark (no weird box) */}
          <span
            aria-hidden
            className="
              inline-grid place-items-center
              w-8 h-8 rounded-lg
              ring-1 ring-white/10
              bg-[radial-gradient(120%_120%_at_30%_20%,rgba(124,58,237,.35),transparent_55%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.08))]
              text-fuchsia-300 shadow-none
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4.5 h-4.5"
            >
              <path d="M10 18V6l9-2v12" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </span>

          <span className="text-sm font-semibold tracking-wide">
            Artist Explorer
          </span>
        </Link>

        {/* Nav */}
        <nav className="nav" role="navigation" aria-label="Main">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            const base =
              "relative px-3 py-1.5 rounded-md transition-colors outline-none";
            const activeCls =
              "font-medium text-fg bg-white/5 border border-white/10";
            const idleCls =
              "text-muted hover:text-fg hover:bg-white/5 border border-transparent";

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`nav-pill ${base} ${active ? activeCls : idleCls}`}
              >
                <span className="nav-pill__txt">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
