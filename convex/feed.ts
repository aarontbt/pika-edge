import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: {
    id: v.id("feedItems"),
  },
  handler: async (ctx, args) => {
    const feedItem = await ctx.db.get(args.id);
    if (!feedItem) return null;

    // Get linked opportunity if exists
    let opportunity = null;
    if (feedItem.opportunityId) {
      opportunity = await ctx.db.get(feedItem.opportunityId);
    }

    // Get city details
    const city = await ctx.db.get(feedItem.cityId);

    return {
      ...feedItem,
      opportunity,
      city,
    };
  },
});

export const list = query({
  args: {
    country: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const country = args.country ?? null;
    const category = args.category ?? null;

    // Use appropriate index based on filters to honor the limit correctly
    if (country && category) {
      // Both filters: use country index, then filter by category
      const items = await ctx.db
        .query("feedItems")
        .withIndex("by_country_created", (q) => q.eq("country", country))
        .order("desc")
        .filter((q) => q.eq(q.field("category"), category))
        .take(limit);
      return items;
    }

    if (country) {
      // Country filter only
      return await ctx.db
        .query("feedItems")
        .withIndex("by_country_created", (q) => q.eq("country", country))
        .order("desc")
        .take(limit);
    }

    if (category) {
      // Category filter only
      return await ctx.db
        .query("feedItems")
        .withIndex("by_category_created", (q) => q.eq("category", category))
        .order("desc")
        .take(limit);
    }

    // No filters: use general created index
    return await ctx.db
      .query("feedItems")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

export const getByCity = query({
  args: {
    cityId: v.id("cities"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("feedItems")
      .withIndex("by_city_created", (q) => q.eq("cityId", args.cityId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const seed = mutation({
  handler: async (ctx) => {
    // Check if feed items already exist
    const existing = await ctx.db.query("feedItems").first();
    if (existing) {
      return { message: "Feed items already seeded" };
    }

    // Get all cities
    const cities = await ctx.db.query("cities").collect();
    if (cities.length === 0) {
      return { message: "Please seed cities first" };
    }

    const feedTypes = [
      "new_opportunity",
      "price_drop",
      "hot_deal",
      "market_alert",
    ] as const;

    const sampleTitles = {
      new_opportunity: [
        "New iPhone 15 deal spotted",
        "Fresh sneaker drop available",
        "Rare collectible listed",
        "Limited edition watch found",
      ],
      price_drop: [
        "Price dropped 15% on electronics",
        "Sneaker prices falling",
        "Bag deal just got better",
        "Gaming console discount",
      ],
      hot_deal: [
        "🔥 HOT: 30% spread on Nike",
        "🔥 HOT: Rare Pokemon cards",
        "🔥 HOT: Luxury bag arbitrage",
        "🔥 HOT: Japanese cosmetics",
      ],
      market_alert: [
        "⚠️ Market shift in electronics",
        "⚠️ New release incoming",
        "⚠️ Currency fluctuation alert",
        "⚠️ Supply shortage expected",
      ],
    };

    const categories = [
      "electronics",
      "sneakers",
      "fashion",
      "collectibles",
      "gaming",
      "watches",
      "bags",
      "cosmetics",
    ];

    let count = 0;
    // Create 30-50 feed items
    const numItems = Math.floor(Math.random() * 20) + 30;

    for (let i = 0; i < numItems; i++) {
      const type = feedTypes[Math.floor(Math.random() * feedTypes.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const titles = sampleTitles[type];
      const title = titles[Math.floor(Math.random() * titles.length)];

      await ctx.db.insert("feedItems", {
        type,
        title: `${title} in ${city.name}`,
        cityId: city._id,
        cityName: city.name,
        country: city.country,
        category,
        priceInfo:
          type === "price_drop"
            ? `Was $${Math.floor(Math.random() * 500) + 100}, now $${Math.floor(Math.random() * 400) + 50}`
            : type === "hot_deal"
              ? `${Math.floor(Math.random() * 30) + 10}% spread`
              : undefined,
        createdAt:
          Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000),
      });
      count++;
    }

    return { message: `Seeded ${count} feed items` };
  },
});
