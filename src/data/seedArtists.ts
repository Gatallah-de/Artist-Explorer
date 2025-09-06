// src/data/seedArtists.ts
export type SeedArtist = { id: string; name: string };

/**
 * Curated set of starter artists for the homepage examples.
 * All IDs are the canonical Spotify Artist IDs.
 */
export const SEED_ARTISTS: SeedArtist[] = [
  // — existing
  { id: "3yY2gUcIsjMr8hjo51PoJ8", name: "The Smiths" },
  { id: "2hR4h1Cao2ueuI7Cx9c7V8", name: "Cavetown" },
  { id: "2uYWxilOVlUdk4oV9DvwqK", name: "Mitski" },
  { id: "5Wabl1lPdNOeIn0SQ5A1mp", name: "Cocteau Twins" },

  // — your additions
  { id: "1AbJ2cmwK400LSvdvBL5Jc", name: "Strawberry Guy" },      // :contentReference[oaicite:0]{index=0}
  { id: "0Y6dVaC9DZtPNH4591M42W", name: "TV Girl" },             // :contentReference[oaicite:2]{index=2}
  { id: "4MXUO7sVCaFgFjoTI5ox5c", name: "Sufjan Stevens" },      // 
  { id: "4LEiUm1SRbFMgfqnQTwUbQ", name: "Bon Iver" },            // 
  { id: "3Sz7ZnJQBIHsXLUSo0OQtM", name: "Mac DeMarco" },         // :contentReference[oaicite:5]{index=5}
  { id: "0m5FakHKCQdA7UN0PIzMcL", name: "Current Joys" },        // :contentReference[oaicite:6]{index=6}
  { id: "0qZyvjwZauLmrobrpJmvib", name: "Dream, Ivory" },        // :contentReference[oaicite:7]{index=7}
  { id: "2HpfqDQ8DBQlnrbAsdIh7s", name: "Take Care" },           // :contentReference[oaicite:8]{index=8}
  { id: "02vrwnrNEeDRV96o9iPSYP", name: "sign crushes motorist" },// :contentReference[oaicite:9]{index=9}
  { id: "2cAvReLDmjFQtCJFDJbHBU", name: "Teen Suicide" },        // :contentReference[oaicite:10]{index=10}
  { id: "4Zjxd2hv7Hb8zJMIy8A1TM", name: "German Error Message" },// :contentReference[oaicite:11]{index=11}
  { id: "0UF7XLthtbSF2Eur7559oV", name: "Kavinsky" },            // :contentReference[oaicite:12]{index=12}
  { id: "63MQldklfxkjYDoUE4Tppz", name: "David Bowie" },         // :contentReference[oaicite:13]{index=13}
  { id: "0SwO7SWeDHJijQ3XNS7xEE", name: "MGMT" },                // :contentReference[oaicite:14]{index=14}
  { id: "0fA0VVWsXO9YnASrzqfmYu", name: "Kid Cudi" },            // :contentReference[oaicite:15]{index=15}
  { id: "7dIpKWlEeAljA20vFJ82RD", name: "ROAR" },                // :contentReference[oaicite:16]{index=16}
];
