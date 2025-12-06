"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = internal as any;

const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const EBAY_APP_ID = process.env.EBAY_APP_ID; // required

// eBay global IDs (best-effort). Adjust if you have region-specific IDs.
const REGION_GLOBAL_ID: Record<string, string> = {
  SG: "EBAY-SG", // If unavailable, eBay may fallback; adjust as needed.
  MY: "EBAY-SG",
  JP: "EBAY-US",
};

const REGION_DEFAULT_CITY: Record<string, string> = {
  SG: "Singapore",
  MY: "Kuala Lumpur",
  JP: "Tokyo",
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

type EbayPrice = {
  __value__?: string;
  "@currencyId"?: string;
};

type EbayItem = {
  itemId?: string[];
  title?: string[];
  viewItemURL?: string[];
  galleryURL?: string[];
  location?: string[];
  sellingStatus?: Array<{
    currentPrice?: EbayPrice[];
  }>;
};

type EbayResponse = {
  findItemsByKeywordsResponse?: Array<{
    ack?: string[];
    searchResult?: Array<{
      item?: EbayItem[];
    }>;
  }>;
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
  return undefined;
}

function buildCacheKey(region: string, keywords: string[]): string {
  const base = keywords.join(",").slice(0, 80);
  return `ebay:${region}:${base}`;
}

function mapItemToCollectible(
  item: EbayItem,
  keyword: string,
  cityName: string,
  referenceCity: string
): CollectibleInput | null {
  const id = item.itemId?.[0];
  const title = item.title?.[0];
  const url = item.viewItemURL?.[0];
  const img = item.galleryURL?.[0];
  const priceObj = item.sellingStatus?.[0]?.currentPrice?.[0];
  const price = priceObj?.__value__ ? Number(priceObj.__value__) : null;
  const currency = priceObj?.["@currencyId"];

  if (!id || !title || !price || !currency) return null;

  return {
    title,
    description: item.location?.[0],
    category: "collectibles",
    subcategory: detectSubcategory(keyword),
    externalId: `ebay:${id}`,
    priceLocal: price,
    priceCurrency: currency,
    referenceCity,
    sourceUrl: url,
    imageUrl: img,
    cityName,
  };
}

export const ingestEbayListings = action({
  args: {
    keywords: v.array(v.string()),
    region: v.optional(v.union(v.literal("SG"), v.literal("MY"), v.literal("JP"))),
    limit: v.optional(v.number()),
    cityName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!EBAY_APP_ID) {
      return { inserted: 0, updated: 0, feedInserted: 0, message: "EBAY_APP_ID not set" };
    }

    const region = args.region ?? "SG";
    const globalId = REGION_GLOBAL_ID[region] ?? "EBAY-US";
    const cityName = args.cityName ?? REGION_DEFAULT_CITY[region] ?? "Singapore";
    const referenceCity = cityName;
    const limit = Math.min(args.limit ?? 20, 50);

    const cacheKey = buildCacheKey(region, args.keywords);
    const cached = await getCache(ctx, cacheKey);
    if (cached && Date.now() - cached.lastFetched < CACHE_TTL_MS) {
      console.log('ingestEbayListings: cache hit', { cacheKey });
      return { inserted: 0, updated: 0, feedInserted: 0, message: "eBay cache hit" };
    }

    const collected: CollectibleInput[] = [];

    for (const keyword of args.keywords) {
      const params = new URLSearchParams({
        "OPERATION-NAME": "findItemsByKeywords",
        "SERVICE-VERSION": "1.13.0",
        "SECURITY-APPNAME": EBAY_APP_ID,
        "RESPONSE-DATA-FORMAT": "JSON",
        "REST-PAYLOAD": "true",
        keywords: keyword,
        "paginationInput.entriesPerPage": limit.toString(),
        "GLOBAL-ID": globalId,
        sortOrder: "StartTimeNewest",
      });

      const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;
      console.log('ingestEbayListings: fetching', { url, keyword, region, limit });
      const json = await fetchJson<EbayResponse>(url, {
        headers: { "User-Agent": "pikaedge/ingest" },
      });
      const items = json?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item ?? [];
      console.log('ingestEbayListings: fetched', { keyword, count: items.length });

      for (const item of items) {
        const mapped = mapItemToCollectible(item, keyword, cityName, referenceCity);
        if (mapped) collected.push(mapped);
      }
    }

    if (collected.length === 0) {
      console.log('ingestEbayListings: no items collected');
      return { inserted: 0, updated: 0, feedInserted: 0, message: "No eBay items found" };
    }

    const result = await ctx.runMutation(api.ingest.insertCollectibles, {
      items: collected,
      createFeed: true,
    });

    console.log('ingestEbayListings: mutation result', result);

    await upsertCache(ctx, cacheKey);

    return result;
  },
});
