import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";

const MAX_ITEMS = 100;

type City = Doc<"cities">;

// Compute activity level based on opportunity count
function computeActivityLevel(count: number): "hot" | "warm" | "normal" | "cold" {
  if (count >= 20) return "hot";
  if (count >= 10) return "warm";
  if (count >= 3) return "normal";
  return "cold";
}

export const insertCollectibles = mutation({
  args: {
    items: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        category: v.string(),
        subcategory: v.optional(v.string()),
        externalId: v.optional(v.string()),
        priceLocal: v.number(),
        priceCurrency: v.string(),
        priceSpread: v.optional(v.number()),
        referenceCity: v.optional(v.string()),
        sourceUrl: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        cityName: v.optional(v.string()),
      })
    ),
    createFeed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.items.length === 0) {
      return { inserted: 0, updated: 0, feedInserted: 0 };
    }

    const cities = await ctx.db.query("cities").collect();
    if (cities.length === 0) {
      return { inserted: 0, updated: 0, feedInserted: 0, message: "No cities available" };
    }

    const cityByName = new Map(
      cities.map((city) => [city.name.toLowerCase(), city])
    );
    const defaultCity = cities[0];

    let inserted = 0;
    let updated = 0;
    let feedInserted = 0;
    const createFeed = args.createFeed ?? true;
    const now = Date.now();

    // Track which cities were affected for stats update
    const affectedCityIds = new Set<Id<"cities">>();

    for (const item of args.items.slice(0, MAX_ITEMS)) {
      const city =
        (item.cityName && cityByName.get(item.cityName.toLowerCase())) ||
        defaultCity;

      affectedCityIds.add(city._id);

      // Check for existing opportunity by externalId (if provided)
      let existingOpportunity = null;
      if (item.externalId) {
        existingOpportunity = await ctx.db
          .query("opportunities")
          .withIndex("by_external_id", (q) => q.eq("externalId", item.externalId))
          .first();
      }

      let opportunityId: Id<"opportunities">;
      let feedType: "new_opportunity" | "price_drop" = "new_opportunity";

      if (existingOpportunity) {
        // Update existing opportunity
        const priceChanged = existingOpportunity.priceLocal !== item.priceLocal;
        const priceDrop = item.priceLocal < existingOpportunity.priceLocal;

        await ctx.db.patch(existingOpportunity._id, {
          title: item.title,
          description: item.description,
          priceLocal: item.priceLocal,
          priceCurrency: item.priceCurrency,
          priceSpread: item.priceSpread,
          sourceUrl: item.sourceUrl,
          imageUrl: item.imageUrl,
          updatedAt: now,
        });

        opportunityId = existingOpportunity._id;
        updated += 1;

        // Only create feed for price drops
        if (priceChanged && priceDrop && createFeed) {
          feedType = "price_drop";
          await ctx.db.insert("feedItems", {
            type: feedType,
            title: `Price drop: ${item.title}`,
            cityId: city._id,
            cityName: city.name,
            country: city.country,
            category: item.category,
            opportunityId,
            priceInfo: `Now ${item.priceCurrency} ${item.priceLocal.toFixed(2)}`,
            imageUrl: item.imageUrl,
            createdAt: now,
          });
          feedInserted += 1;
        }
      } else {
        // Insert new opportunity
        opportunityId = await ctx.db.insert("opportunities", {
          title: item.title,
          description: item.description,
          category: item.category,
          subcategory: item.subcategory,
          externalId: item.externalId,
          priceLocal: item.priceLocal,
          priceCurrency: item.priceCurrency,
          priceSpread: item.priceSpread,
          referenceCity: item.referenceCity,
          sourceUrl: item.sourceUrl,
          imageUrl: item.imageUrl,
          cityId: city._id,
          status: "active",
          createdAt: now,
        });
        inserted += 1;

        if (createFeed) {
          await ctx.db.insert("feedItems", {
            type: "new_opportunity",
            title: item.title,
            cityId: city._id,
            cityName: city.name,
            country: city.country,
            category: item.category,
            opportunityId,
            priceInfo: item.priceSpread
              ? `${item.priceSpread.toFixed(1)}% spread`
              : undefined,
            imageUrl: item.imageUrl,
            createdAt: now,
          });
          feedInserted += 1;
        }
      }
    }

    // Update city stats for affected cities
    for (const cityId of affectedCityIds) {
      const activeCount = await ctx.db
        .query("opportunities")
        .withIndex("by_city", (q) => q.eq("cityId", cityId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      const count = activeCount.length;

      await ctx.db.patch(cityId, {
        opportunityCount: count,
        activityLevel: computeActivityLevel(count),
        lastUpdated: now,
      });
    }

    return { inserted, updated, feedInserted };
  },
});

// Internal mutation to refresh all city stats (can be scheduled)
export const refreshCityStats = internalMutation({
  handler: async (ctx) => {
    const cities = await ctx.db.query("cities").collect();
    const now = Date.now();

    for (const city of cities) {
      const activeOpportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_city", (q) => q.eq("cityId", city._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      const count = activeOpportunities.length;

      await ctx.db.patch(city._id, {
        opportunityCount: count,
        activityLevel: computeActivityLevel(count),
        lastUpdated: now,
      });
    }

    return { citiesUpdated: cities.length };
  },
});
