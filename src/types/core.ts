/* ────────────────────────────── Shared primitives ───────────────────────────── */

export const Providers = ['spotify', 'musicbrainz', 'discogs', 'lastfm'] as const;
export type Provider = typeof Providers[number];

/** URL brand (optional nicety to catch mixups). */
export type UrlString = string & { __brand: 'Url' };

/** Image kinds we may show. */
export type ImageKind = 'profile' | 'cover' | 'gallery' | 'other';

/** Require AT LEAST ONE key from T to be present. */
type AtLeastOne<T extends object, K extends keyof T = keyof T> =
  Partial<T> & { [P in K]-?: Required<Pick<T, P>> & Partial<Omit<T, P>> }[K];

/**
 * Per-provider external IDs.
 * We allow any subset but enforce "at least one present" at compile time.
 *
 * Access like:
 *   artist.ids.spotify
 *   album.ids.musicbrainz
 */
export type ExternalIds = AtLeastOne<Record<Provider, string>>;

/* ──────────────────────────────── Media model ──────────────────────────────── */

export interface Image {
  readonly url: UrlString | string;
  readonly width?: number;
  readonly height?: number;
  readonly kind?: ImageKind;

  /** Optional niceties for placeholders / glow */
  readonly dominantColorHex?: `#${string}`;
  readonly blurhash?: string;
}

/* ─────────────────────────────── Domain models ─────────────────────────────── */

export interface ArtistCore {
  /** External IDs grouped by provider (use `ids.spotify`, etc.). */
  readonly ids: ExternalIds;

  /** Display name */
  readonly name: string;

  /** Images in descending preference order (first is primary). */
  readonly images?: ReadonlyArray<Image>;

  /** High-level buckets; keep raw API genres in adapters. */
  readonly genres?: ReadonlyArray<string>;

  /** Short bio / blurb if available (plain text or lightly formatted). */
  readonly bio?: string;

  /** Cross-provider, optional metrics */
  readonly metrics?: {
    /** Spotify-style popularity 0–100 (if available) */
    readonly popularity?: number;
    /** Followers or subscribers (provider-specific) */
    readonly followers?: number;
    /** e.g. Spotify monthly listeners */
    readonly monthlyListeners?: number;
  };
}

export interface AlbumCore {
  /** External IDs grouped by provider. */
  readonly ids: ExternalIds;

  /** Album title as displayed */
  readonly title: string;

  /** Release year (YYYY) if easily available */
  readonly year?: number;

  /**
   * Prefer full Image; allow simple URL for convenience.
   * If both `cover` and `images` exist, `cover` is the primary.
   */
  readonly cover?: Image | (UrlString | string);
  readonly images?: ReadonlyArray<Image>;

  /** Optional metrics (document scale where relevant) */
  readonly metrics?: {
    /** 0–100 if normalized; else adapter should map raw API values */
    readonly popularity?: number;
    readonly listeners?: number;
    readonly playcount?: number;
    /** Your own rating scale (document it where you use it) */
    readonly rating?: number;
  };
}

/* ───────────────────────────── Helper functions ────────────────────────────── */

/**
 * Returns the first available ID following the preferred order.
 * Default order prefers Spotify, then MusicBrainz, Discogs, Last.fm.
 */
export function getPrimaryId(
  ids: ExternalIds,
  prefer: readonly Provider[] = Providers
): string | undefined {
  for (const p of prefer) {
    const val = ids[p];
    if (val) return val;
  }
  return undefined;
}

/** Type guard: does this object have an ID for a specific provider? */
export function hasProviderId(ids: ExternalIds, provider: Provider): ids is ExternalIds & Record<typeof provider, string> {
  return Boolean(ids[provider]);
}
