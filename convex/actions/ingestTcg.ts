"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

// Work with generated API; if codegen lags, fall back to any.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = internal as any;

// Public API usage best practices:
// - Optional API key via env
// - Short timeouts to avoid hanging actions
// - Guard for non-2xx responses and empty payloads
// - Clamp page sizes to reasonable limits

const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
type CacheDoc = Doc<"ingestCache">;
type IngestResult = { inserted: number; feedInserted: number; message?: string };

async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) return null;
    try {
      return (await res.json()) as T;
    } catch {
      return null; // invalid JSON payload
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function getCache(ctx: ActionCtx, key: string): Promise<CacheDoc | null> {
  return await ctx.runQuery(api.ingestCache.getByKey, { key });
}

async function upsertCache(ctx: ActionCtx, key: string): Promise<void> {
  await ctx.runMutation(api.ingestCache.upsert, {
    key,
    lastFetched: Date.now(),
  });
}

type CollectibleInput = {
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  externalId?: string;
  priceLocal: number;
  priceCurrency: string;
  priceSpread?: number;
  referenceCity?: string;
  sourceUrl?: string;
  imageUrl?: string;
  cityName?: string;
};

type PokemonCard = {
  id: string; // External ID for deduplication
  name: string;
  rarity?: string;
  set?: { name?: string };
  images?: { small?: string; large?: string };
  tcgplayer?: {
    url?: string;
    prices?: {
      holofoil?: { market?: number };
      normal?: { market?: number };
      reverseHolofoil?: { market?: number };
    };
  };
  flavorText?: string;
  rules?: string[];
};

const POKEMON_API = "https://api.pokemontcg.io/v2/cards";
const POKEMON_API_KEY = process.env.POKEMON_TCG_API_KEY;

export const ingestPokemonCards = action({
  args: {
    pageSize: v.optional(v.number()),
    cityName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<IngestResult> => {
    const pageSize = Math.min(args.pageSize ?? 40, 80);
    const cacheKey = "pokemon";

    const cached = await getCache(ctx, cacheKey);
    if (cached && Date.now() - cached.lastFetched < CACHE_TTL_MS) {
      return { inserted: 0, feedInserted: 0, message: "Pokemon cache hit" };
    }

    const url = `${POKEMON_API}?pageSize=${pageSize}&orderBy=-tcgplayer.prices.holofoil.market`;

    const json = await fetchJson<{ data?: PokemonCard[] }>(url, {
      headers: {
        ...(POKEMON_API_KEY ? { "X-Api-Key": POKEMON_API_KEY } : {}),
        "User-Agent": "pikaedge/ingest",
      },
    });

    const cards = json?.data ?? [];

    const items: CollectibleInput[] = cards
      .map((card): CollectibleInput | null => {
        const price =
          card.tcgplayer?.prices?.holofoil?.market ??
          card.tcgplayer?.prices?.reverseHolofoil?.market ??
          card.tcgplayer?.prices?.normal?.market;

        if (!price || price <= 0) return null;

        return {
          title: `${card.name} - ${card.set?.name ?? "Unknown Set"} (${
            card.rarity ?? "Unknown"
          })`,
          description:
            card.flavorText ??
            (card.rules ? card.rules.join(" ") : undefined) ??
            undefined,
          category: "collectibles",
          subcategory: "pokemon-tcg",
          externalId: `pokemon:${card.id}`,
          priceLocal: price,
          priceCurrency: "USD",
          priceSpread: undefined,
          referenceCity: "Tokyo",
          sourceUrl: card.tcgplayer?.url,
          imageUrl: card.images?.large ?? card.images?.small,
          cityName: args.cityName ?? "Tokyo",
        };
      })
      .filter((card): card is CollectibleInput => Boolean(card));

    if (items.length === 0) {
      return { inserted: 0, feedInserted: 0, message: "No priced cards found" };
    }

    const result = await ctx.runMutation(api.ingest.insertCollectibles, {
      items,
      createFeed: true,
    });

    await upsertCache(ctx, cacheKey);

    return result;
  },
});

// Placeholder for One Piece TCG community API (fan-maintained).
// Replace `ONE_PIECE_API` with a reliable endpoint when available.
const ONE_PIECE_API = "https://api.onepiecetcg.dev/api/cards";

type OnePieceCard = {
  id?: string; // External ID for deduplication
  name: string;
  card_sets?: { set_name?: string }[];
  rarity?: string;
  image?: string;
  price?: number;
  url?: string;
};

export const ingestOnePieceCards = action({
  args: {
    pageSize: v.optional(v.number()),
    cityName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<IngestResult> => {
    const pageSize = Math.min(args.pageSize ?? 30, 60);
    const cacheKey = "onepiece";

    const cached = await getCache(ctx, cacheKey);
    if (cached && Date.now() - cached.lastFetched < CACHE_TTL_MS) {
      return { inserted: 0, feedInserted: 0, message: "One Piece cache hit" };
    }

    const url = `${ONE_PIECE_API}?pageSize=${pageSize}`;

    const json = await fetchJson<{ data?: OnePieceCard[] }>(url, {
      headers: { "User-Agent": "pikaedge/ingest" },
    });
    if (!json) {
      return { inserted: 0, feedInserted: 0, message: "One Piece API unavailable" };
    }

    const cards = json.data ?? [];

    const items: CollectibleInput[] = cards
      .map((card): CollectibleInput | null => {
        const price = card.price ?? null;
        if (!price || price <= 0) return null;

        const setName = card.card_sets?.[0]?.set_name ?? "Unknown Set";

        // Generate stable external ID from name+set if no ID provided
        const externalId = card.id
          ? `onepiece:${card.id}`
          : `onepiece:${card.name}:${setName}`.toLowerCase().replace(/\s+/g, "-");

        return {
          title: `${card.name} - ${setName} (${card.rarity ?? "Unknown"})`,
          description: setName,
          category: "collectibles",
          subcategory: "onepiece-tcg",
          externalId,
          priceLocal: price,
          priceCurrency: "USD",
          priceSpread: undefined,
          referenceCity: "Singapore",
          sourceUrl: card.url,
          imageUrl: card.image,
          cityName: args.cityName ?? "Singapore",
        };
      })
      .filter((card): card is CollectibleInput => Boolean(card));

    if (items.length === 0) {
      return { inserted: 0, feedInserted: 0, message: "No priced cards found" };
    }

    const result = await ctx.runMutation(api.ingest.insertCollectibles, {
      items,
      createFeed: true,
    });

    await upsertCache(ctx, cacheKey);

    return result;
  },
});
