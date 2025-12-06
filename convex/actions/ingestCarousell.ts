"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = internal as any;

const FETCH_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const APIFY_TOKEN = process.env.APIFY_TOKEN; // required
const ACTOR = "lexis-solutions~carousell-scraper"; // public Apify actor for Carousell

const REGION_DEFAULT_CITY: Record<string, string> = {
  SG: "Singapore",
  MY: "Kuala Lumpur",
};

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

type ApifyCarousellItem = {
  id?: string;
  title?: string;
  price?: { amount?: number; currency?: string } | number;
  url?: string;
  image?: string;
  location?: string;
};

type ApifyRunResponse = {
  items?: ApifyCarousellItem[];
};

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

function detectSubcategory(keyword: string): string | undefined {
  const kw = keyword.toLowerCase();
  if (kw.includes("pokemon")) return "pokemon-tcg";
  if (kw.includes("one piece")) return "onepiece-tcg";
  if (kw.includes("yugioh") || kw.includes("yugi")) return "yugioh";
  return undefined;
}

function normalizePrice(price: ApifyCarousellItem["price"]): { amount: number; currency: string } | null {
  if (price == null) return null;
  if (typeof price === "number") return { amount: price, currency: "SGD" };
  const amt = price.amount;
  const cur = price.currency ?? "SGD";
  if (amt == null || Number.isNaN(amt)) return null;
  return { amount: amt, currency: cur };
}

function mapItemToCollectible(
  item: ApifyCarousellItem,
  keyword: string,
  cityName: string
): CollectibleInput | null {
  const priceObj = normalizePrice(item.price);
  if (!item.title || !priceObj) return null;

  return {
    title: item.title,
    description: item.location,
    category: "collectibles",
    subcategory: detectSubcategory(keyword),
    externalId: item.id ? `carousell:${item.id}` : undefined,
    priceLocal: priceObj.amount,
    priceCurrency: priceObj.currency,
    referenceCity: cityName,
    sourceUrl: item.url,
    imageUrl: item.image,
    cityName,
  };
}

async function runCarousellActor(keywords: string[], region: string, limit: number) {
  const input = {
    search: keywords.join(", "),
    maxItems: limit,
    country: region.toLowerCase(), // actor accepts country code like sg/my
  };

  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  return await fetchJson<ApifyRunResponse>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "pikaedge/ingest" },
    body: JSON.stringify(input),
  });
}

export const ingestCarousellListings = action({
  args: {
    keywords: v.array(v.string()),
    region: v.optional(v.union(v.literal("SG"), v.literal("MY"))),
    limit: v.optional(v.number()),
    cityName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!APIFY_TOKEN) {
      return { inserted: 0, updated: 0, feedInserted: 0, message: "APIFY_TOKEN not set" };
    }

    const region = args.region ?? "SG";
    const cityName = args.cityName ?? REGION_DEFAULT_CITY[region] ?? "Singapore";
    const limit = Math.min(args.limit ?? 30, 80);

    const cacheKey = `carousell:${region}:${args.keywords.join(",")}`;
    const cached = await getCache(ctx, cacheKey);
    if (cached && Date.now() - cached.lastFetched < CACHE_TTL_MS) {
      console.log("ingestCarousell: cache hit", { cacheKey });
      return { inserted: 0, updated: 0, feedInserted: 0, message: "Carousell cache hit" };
    }

    console.log("ingestCarousell: fetching", { region, keywords: args.keywords, limit });
    const json = await runCarousellActor(args.keywords, region, limit);
    const items = json?.items ?? [];
    console.log("ingestCarousell: fetched", { count: items.length });

    // Detect subcategory from the first keyword (items are already filtered by all keywords)
    const primaryKeyword = args.keywords[0] ?? "";
    const collected: CollectibleInput[] = [];
    for (const item of items) {
      const mapped = mapItemToCollectible(item, primaryKeyword, cityName);
      if (mapped) collected.push(mapped);
    }

    if (collected.length === 0) {
      console.log("ingestCarousell: no items collected");
      return { inserted: 0, updated: 0, feedInserted: 0, message: "No Carousell items found" };
    }

    const result = await ctx.runMutation(api.ingest.insertCollectibles, {
      items: collected,
      createFeed: true,
    });

    console.log("ingestCarousell: mutation result", result);

    await upsertCache(ctx, cacheKey);

    return result;
  },
});
