"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = internal as any;

const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours since Scryfall prices update daily
const SCRYFALL_SEARCH = "https://api.scryfall.com/cards/search";

// Default: use USD; fallback to EUR if USD missing.
function pickPrice(prices: Record<string, string | null | undefined>): { amount: number; currency: string } | null {
  const usd = prices["usd"];
  const eur = prices["eur"];
  if (usd && !Number.isNaN(Number(usd))) return { amount: Number(usd), currency: "USD" };
  if (eur && !Number.isNaN(Number(eur))) return { amount: Number(eur), currency: "EUR" };
  return null;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) return null;
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function getCache(ctx: ActionCtx, key: string) {
  return await ctx.runQuery(api.ingestCache.getByKey, { key });
}

async function upsertCache(ctx: ActionCtx, key: string) {
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

type ScryfallCard = {
  id: string;
  name: string;
  set: string;
  collector_number?: string;
  image_uris?: { large?: string; normal?: string; small?: string };
  prices: Record<string, string | null | undefined>;
  oracle_text?: string;
  type_line?: string;
};

type ScryfallResponse = {
  data?: ScryfallCard[];
  has_more?: boolean;
  next_page?: string;
};

function toExternalId(card: ScryfallCard): string {
  return `scryfall:${card.id}`;
}

function mapCard(card: ScryfallCard, cityName: string): CollectibleInput | null {
  const price = pickPrice(card.prices);
  if (!price) return null;

  const img = card.image_uris?.large ?? card.image_uris?.normal ?? card.image_uris?.small;
  const title = `${card.name} [${card.set.toUpperCase()} ${card.collector_number ?? ""}]`.trim();
  const description = card.oracle_text ?? card.type_line;

  return {
    title,
    description,
    category: "collectibles",
    subcategory: "mtg",
    externalId: toExternalId(card),
    priceLocal: price.amount,
    priceCurrency: price.currency,
    priceSpread: undefined,
    referenceCity: cityName,
    sourceUrl: `https://scryfall.com/card/${card.set}/${card.collector_number ?? ""}`,
    imageUrl: img,
    cityName,
  };
}

async function fetchAll(ctx: ActionCtx, url: string, cityName: string, pageLimit: number) {
  let next: string | null = url;
  const collected: CollectibleInput[] = [];
  let page = 0;

  while (next && page < pageLimit) {
    console.log("ingestScryfall: fetching page", { page, url: next });
    const json: ScryfallResponse | null = await fetchJson<ScryfallResponse>(next, {
      headers: { "User-Agent": "pikaedge/ingest" },
    });
    if (!json) break;

    const cards = json.data ?? [];
    console.log("ingestScryfall: page fetched", { page, count: cards.length });

    for (const card of cards) {
      const mapped = mapCard(card, cityName);
      if (mapped) collected.push(mapped);
    }

    next = json.has_more ? json.next_page ?? null : null;
    page += 1;
  }

  return collected;
}

export const ingestScryfall = action({
  args: {
    query: v.optional(v.string()), // Scryfall search syntax
    pageLimit: v.optional(v.number()),
    cityName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cacheKey = `scryfall:${args.query ?? "default"}`;
    const cached = await getCache(ctx, cacheKey);
    if (cached && Date.now() - cached.lastFetched < CACHE_TTL_MS) {
      console.log("ingestScryfall: cache hit", { cacheKey });
      return { inserted: 0, updated: 0, feedInserted: 0, message: "Scryfall cache hit" };
    }

    const q = args.query ?? "game:paper unique:prints order:usd";
    const firstUrl = `${SCRYFALL_SEARCH}?q=${encodeURIComponent(q)}`;
    const cityName = args.cityName ?? "Tokyo";
    const pageLimit = Math.min(args.pageLimit ?? 3, 5); // up to ~500-600 cards per call

    console.log("ingestScryfall: start", { q, pageLimit });
    const collected = await fetchAll(ctx, firstUrl, cityName, pageLimit);
    console.log("ingestScryfall: collected", { count: collected.length });

    if (collected.length === 0) {
      return { inserted: 0, updated: 0, feedInserted: 0, message: "No Scryfall cards found" };
    }

    const result = await ctx.runMutation(api.ingest.insertCollectibles, {
      items: collected,
      createFeed: true,
    });

    console.log("ingestScryfall: mutation result", result);

    await upsertCache(ctx, cacheKey);

    return result;
  },
});
