import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Album — Artist Explorer",
  description: "Album details and tracklist.",
};

export default function AlbumLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      role="main"
      className="
        mx-auto w-full max-w-[96rem]
        px-6 lg:px-12
        space-y-12 md:space-y-14
      "
    >
      {children}
    </main>
  );
}
