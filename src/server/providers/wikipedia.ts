// src/server/providers/wikipedia.ts
export type WikiSummary = {
  title: string;
  extract?: string;
  content_urls?: { desktop?: { page: string } };
};

export async function getArtistBio(name: string): Promise<WikiSummary | null> {
  const url = new URL(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
  );
  const res = await fetch(url, { next: { revalidate: 60 * 60 } }); // 1h cache
  if (!res.ok) return null;
  const data = (await res.json()) as WikiSummary;
  if (!data?.extract) return null;
  return data;
}
