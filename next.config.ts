import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Scryfall (MTG cards)
      { protocol: "https", hostname: "cards.scryfall.io" },
      { protocol: "https", hostname: "*.scryfall.io" },
      // Pokemon TCG
      { protocol: "https", hostname: "images.pokemontcg.io" },
      // eBay
      { protocol: "https", hostname: "*.ebayimg.com" },
      { protocol: "https", hostname: "i.ebayimg.com" },
      // Carousell
      { protocol: "https", hostname: "*.carousell.com" },
      { protocol: "https", hostname: "media.karousell.com" },
      // Generic fallback for other CDNs
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.imgix.net" },
    ],
  },
};

export default nextConfig;
