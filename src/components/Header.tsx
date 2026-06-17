"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5L12 3Z" />
      </svg>
    ),
  },
  {
    href: "/favorites",
    label: "Favorites",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path d="M12 21.35 10.55 20C5.4 15.24 2 12.09 2 8.25A5.25 5.25 0 0 1 7.25 3c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 16.25 3 5.25 5.25 0 0 1 21.5 8.25c0 3.84-3.4 6.99-8.55 11.75L12 21.35Z" />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "About",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm1 15h-2v-6h2Zm-1-8.5A1.25 1.25 0 1 1 13.25 7 1.25 1.25 0 0 1 12 8.5Z" />
      </svg>
    ),
  },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <>
      <header
        role="banner"
        aria-label="Primary"
        className="
          sticky top-0 z-50
          border-b border-white/10
          bg-[rgba(10,12,22,.72)]
          backdrop-blur-md
        "
      >
        <div className="container-x flex h-14 items-center justify-between">
          <Link
            href="/"
            aria-label="Artist Explorer — Home"
            className="flex items-center gap-3 select-none"
          >
            <span
              aria-hidden
              className="
                inline-grid h-9 w-9 place-items-center
                rounded-xl border border-white/10
                text-fuchsia-300
                bg-[radial-gradient(120%_120%_at_30%_20%,rgba(124,58,237,.35),transparent_55%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.08))]
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M10 18V6l9-2v12" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </span>

            <span className="text-sm font-semibold tracking-wide text-fg">
              Artist Explorer
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav
            role="navigation"
            aria-label="Main"
            className="hidden items-center gap-2 md:flex"
          >
            {NAV.map(({ href, label }) => {
              const active =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-lg border px-4 py-2 text-sm transition-colors",
                    active
                      ? "border-white/10 bg-white/5 text-fg"
                      : "border-transparent text-muted hover:bg-white/5 hover:text-fg",
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav
        role="navigation"
        aria-label="Mobile navigation"
        className="
          fixed inset-x-0 bottom-0 z-50
          border-t border-white/10
          bg-[rgba(10,12,22,.9)]
          backdrop-blur-xl
          md:hidden
        "
      >
        <div className="grid grid-cols-3">
          {NAV.map(({ href, label, icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-[64px] flex-col items-center justify-center gap-1",
                  "transition-colors",
                  active
                    ? "text-fuchsia-400"
                    : "text-muted hover:text-fg",
                ].join(" ")}
              >
                {icon}

                <span className="text-xs font-medium">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom navigation */}
      <div className="h-20 md:hidden" />
    </>
  );
}
