export const env = {
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ?? "",
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ?? "",
  SONGKICK_API_KEY: process.env.SONGKICK_API_KEY ?? "",
  BANDSINTOWN_APP_ID: process.env.BANDSINTOWN_APP_ID ?? "",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  DEFAULT_MARKET: process.env.DEFAULT_MARKET ?? "DE", // NEW
};
