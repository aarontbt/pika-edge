import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const STALE_AFTER_MS = 6 * 60 * 60 * 1000; // 6 hours

const postValidator = v.object({
  postId: v.string(),
  authorHandle: v.string(),
  authorName: v.optional(v.string()),
  content: v.string(),
  postedAt: v.number(),
  url: v.string(),
  metrics: v.optional(
    v.object({
      likes: v.optional(v.number()),
      reposts: v.optional(v.number()),
      replies: v.optional(v.number()),
    })
  ),
});

export const upsertSentiment = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    platform: v.literal("x.com"),
    posts: v.array(postValidator),
    searchQuery: v.string(),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("socialSentiment")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        posts: args.posts,
        lastFetched: args.fetchedAt,
        searchQuery: args.searchQuery,
      });
      return existing._id;
    }

    return await ctx.db.insert("socialSentiment", {
      opportunityId: args.opportunityId,
      platform: args.platform,
      posts: args.posts,
      lastFetched: args.fetchedAt,
      searchQuery: args.searchQuery,
    });
  },
});

export const getSentimentByOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialSentiment")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId))
      .first();
  },
});

export const getOpportunitiesNeedingSentiment = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const now = Date.now();
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_status_created")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(limit * 2); // over-fetch to account for filtered items

    const candidates: { opportunityId: string; title: string; category?: string }[] = [];

    for (const opp of opportunities) {
      const sentiment = await ctx.db
        .query("socialSentiment")
        .withIndex("by_opportunity", (q) => q.eq("opportunityId", opp._id))
        .first();

      const isStale = !sentiment || now - sentiment.lastFetched > STALE_AFTER_MS;
      if (isStale) {
        candidates.push({
          opportunityId: opp._id,
          title: opp.title,
          category: opp.category,
        });
      }

      if (candidates.length >= limit) break;
    }

    return candidates;
  },
});
