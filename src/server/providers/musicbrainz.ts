// src/server/providers/musicbrainz.ts

// Minimal MusicBrainz helper – WS/2 JSON
const MB_BASE = "https://musicbrainz.org/ws/2";
const UA = "artist-explorer/1.0 (+https://example.com)";

async function mb(path: string, params: Record<string, string>) {
  const url = new URL(`${MB_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("fmt", "json");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": UA },
    next: { revalidate: 60 * 60 },
  });
  if (!res.ok) throw new Error(`MusicBrainz ${path} ${res.status}`);
  return res.json();
}

export type Credit = {
  role: string;
  name: string;
  mbid?: string;
  target?: "release" | "recording";
};

export type AlbumCredits = {
  source: "musicbrainz";
  mbid?: string;
  credits: Credit[];
};

const norm = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "") // strip diacritics
    .replace(/\s*\([^)]*\)\s*/g, " ") // drop parentheses content
    .replace(/[-–—:]/g, " ")
    .replace(/\b(deluxe|remaster(ed)?|expanded|anniversary|special edition)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

function scoreTitleArtist(
  candidateTitle: string,
  candidateArtist: string,
  wantTitle: string,
  wantArtist: string,
  _wantYear?: number
) {
  const t = norm(wantTitle);
  const a = norm(wantArtist);
  const ct = norm(candidateTitle);
  const ca = norm(candidateArtist);
  let score = 0;
  if (ct === t) score += 3;
  else if (ct.includes(t) || t.includes(ct)) score += 2;
  if (ca.includes(a) || a.includes(ca)) score += 2;
  return score;
}

/* --------------------------------------------------------------- */
/* Search helpers                                                  */
/* --------------------------------------------------------------- */

// 1) Try release-group search (preferred)
async function searchReleaseGroups(title: string, artist: string, year?: number) {
  const q = [`release:"${title}"`, `artist:"${artist}"`];
  if (year) q.push(`date:${year}`);
  const data = await mb("release-group", { query: q.join(" AND "), limit: "10" });
  return (data?.["release-groups"] ?? []) as any[];
}

// 2) Fallback: release search (can be easier to match), then map to RG
async function searchReleases(title: string, artist: string, year?: number) {
  const q = [`release:"${title}"`, `artist:"${artist}"`];
  if (year) q.push(`date:${year}`);
  const data = await mb("release", { query: q.join(" AND "), limit: "10" });
  return (data?.releases ?? []) as any[];
}

export async function findMbCandidate(opts: {
  title: string;
  artist: string;
  year?: number;
}): Promise<{ rgId?: string; releaseId?: string }> {
  const { title, artist, year } = opts;

  // strict RG search
  const rgs = await searchReleaseGroups(title, artist, year).catch(() => []);
  if (rgs.length) {
    const scored = rgs
      .map((rg: any) => ({
        rgId: rg?.id as string | undefined,
        title: rg?.title ?? "",
        artist: rg?.["artist-credit"]?.map((ac: any) => ac?.name).join(" ") ?? "",
        primary: String(rg?.["primary-type"] ?? "").toLowerCase(),
        score:
          scoreTitleArtist(
            rg?.title ?? "",
            (rg?.["artist-credit"] ?? []).map((ac: any) => ac?.name).join(" "),
            title,
            artist,
            year
          ) + (String(rg?.["primary-type"] ?? "").toLowerCase() === "album" ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (best?.rgId) return { rgId: best.rgId };
  }

  // RG search without year
  if (year) {
    const rgs2 = await searchReleaseGroups(title, artist).catch(() => []);
    const scored = rgs2
      .map((rg: any) => ({
        rgId: rg?.id as string | undefined,
        title: rg?.title ?? "",
        artist: rg?.["artist-credit"]?.map((ac: any) => ac?.name).join(" ") ?? "",
        primary: String(rg?.["primary-type"] ?? "").toLowerCase(),
        score: scoreTitleArtist(
          rg?.title ?? "",
          (rg?.["artist-credit"] ?? []).map((ac: any) => ac?.name).join(" "),
          title,
          artist
        ),
      }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (best?.rgId) return { rgId: best.rgId };
  }

  // Release search (strict)
  const rels = await searchReleases(title, artist, year).catch(() => []);
  if (rels.length) {
    const scored = rels
      .map((r: any) => ({
        releaseId: r?.id as string | undefined,
        rgId: r?.["release-group"]?.id as string | undefined,
        title: r?.title ?? "",
        artist: r?.["artist-credit"]?.map((ac: any) => ac?.name).join(" ") ?? "",
        score: scoreTitleArtist(
          r?.title ?? "",
          (r?.["artist-credit"] ?? []).map((ac: any) => ac?.name).join(" "),
          title,
          artist,
          year
        ),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (best?.rgId || best?.releaseId) {
      const out: { rgId?: string; releaseId?: string } = {};
      if (best.rgId) out.rgId = best.rgId;
      if (best.releaseId) out.releaseId = best.releaseId;
      return out;
    }
  }

  // Release search (no year)
  if (year) {
    const rels2 = await searchReleases(title, artist).catch(() => []);
    const scored = rels2
      .map((r: any) => ({
        releaseId: r?.id as string | undefined,
        rgId: r?.["release-group"]?.id as string | undefined,
        title: r?.title ?? "",
        artist: r?.["artist-credit"]?.map((ac: any) => ac?.name).join(" ") ?? "",
        score: scoreTitleArtist(
          r?.title ?? "",
          (r?.["artist-credit"] ?? []).map((ac: any) => ac?.name).join(" "),
          title,
          artist
        ),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (best?.rgId || best?.releaseId) {
      const out: { rgId?: string; releaseId?: string } = {};
      if (best.rgId) out.rgId = best.rgId;
      if (best.releaseId) out.releaseId = best.releaseId;
      return out;
    }
  }

  // Normalized/stripped title retry
  const stripped = norm(title);
  if (stripped && stripped !== norm(title)) {
    const tryAgain = await searchReleaseGroups(stripped, artist, year).catch(() => []);
    if (tryAgain.length) {
      const scored = tryAgain
        .map((rg: any) => ({
          rgId: rg?.id as string | undefined,
          title: rg?.title ?? "",
          artist: rg?.["artist-credit"]?.map((ac: any) => ac?.name).join(" ") ?? "",
          score: scoreTitleArtist(
            rg?.title ?? "",
            (rg?.["artist-credit"] ?? []).map((ac: any) => ac?.name).join(" "),
            stripped,
            artist,
            year
          ),
        }))
        .sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (best?.rgId) return { rgId: best.rgId };
    }
  }

  return {};
}

/* --------------------------------------------------------------- */
/* Choose a release with real relations                             */
/* --------------------------------------------------------------- */

// Probe a release and count useful relations (release+recordings)
async function getReleaseRelationScore(releaseId: string): Promise<number> {
  const inc =
    "recordings+media+artist-credits+labels+url-rels+recording-rels+artist-rels+label-rels+work-rels";
  const rel = await mb(`release/${releaseId}`, { inc });
  let score = 0;

  for (const r of rel?.relations ?? []) {
    if (String(r?.type ?? "")) score += 1;
  }
  for (const med of rel?.media ?? []) {
    for (const trk of med?.tracks ?? []) {
      for (const rr of trk?.recording?.relations ?? []) {
        if (String(rr?.type ?? "")) score += 1;
      }
    }
  }
  return score;
}

export async function getReleaseFromGroup(
  rgMbid: string
): Promise<{ id?: string } | null> {
  const data = await mb(`release-group/${rgMbid}`, { inc: "releases" });
  const releases = (data?.releases ?? []) as any[];
  if (!releases.length) return null;

  const officials = releases.filter(
    (r) => String(r?.status ?? "").toLowerCase() === "official"
  );
  const candidates = officials.length ? officials : releases;

  // Check up to 6 candidates to keep it polite with MB rate limits
  const sample = candidates.slice(0, 6);

  const scored = await Promise.all(
    sample.map(async (r) => ({
      id: String(r.id),
      score: await getReleaseRelationScore(String(r.id)).catch(() => 0),
    }))
  );

  const best =
    scored.sort((a, b) => b.score - a.score).find((x) => x.score > 0)?.id ??
    candidates[0]?.id ??
    releases[0]?.id;

  return best ? { id: String(best) } : null;
}

/* --------------------------------------------------------------- */
/* Credits extraction                                               */
/* --------------------------------------------------------------- */
export async function getAlbumCreditsByRelease(mbid: string): Promise<AlbumCredits> {
  const inc =
    "recordings+media+artist-credits+labels+url-rels+recording-rels+artist-rels+label-rels+work-rels";
  const rel = await mb(`release/${mbid}`, { inc });

  const credits: Credit[] = [];

  const pushRel = (relObj: any, target: "release" | "recording") => {
    const type: string | undefined = relObj?.type;
    const mbArtist = relObj?.artist ?? relObj?.["artist-credit"]?.[0]?.artist;
    const name: string | undefined =
      mbArtist?.name ??
      relObj?.["target-credit"] ??
      relObj?.["artist-credit-phrase"] ??
      relObj?.name;
    const artistMbid: string | undefined = mbArtist?.id;

    if (!type || !name) return;

    const role = String(type).toLowerCase();

    // Include mbid only if defined (no undefined props)
    const item: Omit<Credit, "mbid"> & Partial<Pick<Credit, "mbid">> = {
      role,
      name,
      target,
      ...(artistMbid ? { mbid: artistMbid } : {}),
    };

    credits.push(item as Credit);
  };

  for (const r of rel?.relations ?? []) pushRel(r, "release");
  for (const med of rel?.media ?? []) {
    for (const trk of med?.tracks ?? []) {
      for (const rr of trk?.recording?.relations ?? []) pushRel(rr, "recording");
    }
  }

  // de-dup
  const seen = new Set<string>();
  const uniq = credits.filter((c) => {
    const key = `${c.role}::${c.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { source: "musicbrainz", mbid, credits: uniq };
}

/* --------------------------------------------------------------- */
/* Main convenience                                                */
/* --------------------------------------------------------------- */

export async function getAlbumCreditsByMeta(opts: {
  title: string;
  artist: string;
  year?: number;
}): Promise<AlbumCredits> {
  const candidate = await findMbCandidate(opts);
  if (!candidate.rgId && !candidate.releaseId) {
    // Build a mutable AlbumCredits, not a const-asserted literal
    return { source: "musicbrainz", credits: [] };
  }

  let releaseId = candidate.releaseId;
  if (!releaseId && candidate.rgId) {
    const rel = await getReleaseFromGroup(candidate.rgId);
    releaseId = rel?.id;
  }

  if (!releaseId) {
    // Build + optionally attach mbid (avoid spreading a const-asserted object)
    const result: AlbumCredits = { source: "musicbrainz", credits: [] };
    if (candidate.rgId) result.mbid = candidate.rgId;
    return result;
  }

  return getAlbumCreditsByRelease(releaseId);
}
