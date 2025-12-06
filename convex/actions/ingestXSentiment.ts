"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Allow using newly added modules without regenerated types during development.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internalApi = internal as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicApi = api as any;

type FirecrawlResult = {
  title?: string;
  url?: string;
  snippet?: string;
  content?: string;
  publishedAt?: string;
  siteName?: string;
};

type FirecrawlSearchResponse = {
  data?: {
    results?: FirecrawlResult[];
  };
  message?: string;
};

// Limit scraping timeouts and calls
const FETCH_TIMEOUT_MS = 12_000;
const DEFAULT_LIMIT = 6;
const BATCH_LIMIT = 10; // keep batches small to avoid rate limits

function buildSearchQuery(title: string, category?: string) {
  const parts = [`"${title}"`, category, "site:x.com"];
  return parts.filter(Boolean).join(" ");
}

function withTimeout<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  ms: number
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return Promise.race([
    factory(controller.signal),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]).finally(() => clearTimeout(timeout));
}

async function searchX(
  _ctx: ActionCtx,
  query: string,
  apiKey: string
): Promise<FirecrawlResult[]> {
  const url = "https://api.firecrawl.dev/v0/search";
  const body = JSON.stringify({
    query,
    limit: DEFAULT_LIMIT,
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true,
    },
  });

  try {
    const res = await withTimeout(
      (signal) =>
        fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body,
          signal,
        }),
      FETCH_TIMEOUT_MS
    );

    if (!res.ok) {
      console.error("ingestXSentiment: search failed", {
        status: res.status,
        statusText: res.statusText,
      });
      return [];
    }

    const json = (await res.json()) as FirecrawlSearchResponse;
    return json.data?.results ?? [];
  } catch (err) {
    const isAbort =
      err instanceof Error &&
      (err.name === "AbortError" || err.message?.includes("aborted"));
    if (!isAbort) {
      console.error("ingestXSentiment: search exception", err);
    }
    return [];
  }
}

function mapResults(results: FirecrawlResult[]) {
  return results
    .filter((r) => r.url && r.snippet)
    .slice(0, DEFAULT_LIMIT)
    .map((r) => {
      const url = r.url!;
      const postId = url.split("/").pop() ?? url;
      const postedAt = r.publishedAt ? Date.parse(r.publishedAt) : Date.now();

      return {
        postId,
        authorHandle: extractHandle(url),
        authorName: r.siteName,
        content: r.snippet ?? r.content ?? r.title ?? "",
        postedAt: Number.isNaN(postedAt) ? Date.now() : postedAt,
        url,
        metrics: undefined,
      };
    });
}

function extractHandle(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments[0] ? `@${segments[0]}` : "unknown";
  } catch {
    return "unknown";
  }
}

async function processOpportunity({
  ctx,
  opportunityId,
  title,
  category,
  apiKey,
  queryOverride,
}: {
  ctx: ActionCtx;
  opportunityId: Id<"opportunities">;
  title: string;
  category?: string;
  apiKey: string;
  queryOverride?: string | null;
}): Promise<{
  posts: {
    postId: string;
    authorHandle: string;
    authorName?: string;
    content: string;
    postedAt: number;
    url: string;
    metrics?:
      | {
          likes?: number | undefined;
          reposts?: number | undefined;
          replies?: number | undefined;
        }
      | undefined;
  }[];
  sentimentId: string;
  searchQuery: string;
}> {
  const searchQuery = queryOverride ?? buildSearchQuery(title, category);

  const results = await searchX(ctx, searchQuery, apiKey);
  const posts = mapResults(results);

  const sentimentId = await ctx.runMutation(internalApi.sentiment.upsertSentiment, {
    opportunityId,
    searchQuery,
    platform: "x.com",
    posts,
    fetchedAt: Date.now(),
  });

  return { posts, sentimentId, searchQuery };
}

export const ingestXSentiment = action({
  args: {
    opportunityId: v.id("opportunities"),
    queryOverride: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    inserted: number;
    sentimentId?: string;
    message: string;
  }> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.error("ingestXSentiment: missing FIRECRAWL_API_KEY");
      return { inserted: 0, message: "FIRECRAWL_API_KEY not set" };
    }

    const opportunity = await ctx.runQuery(publicApi.opportunities.getById, {
      opportunityId: args.opportunityId,
    });

    if (!opportunity) {
      return { inserted: 0, message: "Opportunity not found" };
    }

    const { posts, sentimentId } = await processOpportunity({
      ctx,
      opportunityId: args.opportunityId,
      title: opportunity.title,
      category: opportunity.category,
      apiKey,
      queryOverride: args.queryOverride,
    });

    return {
      inserted: posts.length,
      sentimentId,
      message: posts.length ? "Sentiment updated" : "No posts found",
    };
  },
});

export const ingestXSentimentBatch = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    processed: number;
    inserted: number;
    message: string;
  }> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.error("ingestXSentimentBatch: missing FIRECRAWL_API_KEY");
      return { processed: 0, inserted: 0, message: "FIRECRAWL_API_KEY not set" };
    }

    const limit = Math.min(args.limit ?? BATCH_LIMIT, BATCH_LIMIT);
    const candidates = await ctx.runQuery(publicApi.sentiment.getOpportunitiesNeedingSentiment, {
      limit,
    });

    let processed = 0;
    let inserted = 0;

    for (const candidate of candidates) {
      try {
        const result = await processOpportunity({
          ctx,
          opportunityId: candidate.opportunityId as Id<"opportunities">,
          title: candidate.title,
          category: candidate.category ?? undefined,
          apiKey,
          queryOverride: null,
        });
        inserted += result.posts.length;
        processed += 1;
      } catch (error) {
        console.error("ingestXSentimentBatch: failed for opportunity", {
          opportunityId: candidate.opportunityId,
          error,
        });
      }
    }

    return {
      processed,
      inserted,
      message: `Processed ${processed} opportunities`,
    };
  },
});
