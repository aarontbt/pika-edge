import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Metro cities/tiles
  cities: defineTable({
    name: v.string(),
    country: v.string(),
    countryName: v.string(),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    opportunityCount: v.number(),
    activityLevel: v.union(
      v.literal("hot"),
      v.literal("warm"),
      v.literal("normal"),
      v.literal("cold")
    ),
    lastUpdated: v.number(),
  })
    .index("by_country", ["country"])
    .index("by_activity", ["activityLevel"]),

  // Arbitrage opportunities
  opportunities: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    cityId: v.id("cities"),
    category: v.string(),
    subcategory: v.optional(v.string()), // e.g., "pokemon-tcg", "onepiece-tcg"
    externalId: v.optional(v.string()),  // External source ID for deduplication
    priceLocal: v.number(),
    priceCurrency: v.string(),
    priceSpread: v.optional(v.number()),
    referenceCity: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("sold")
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),    // Track price updates
    expiresAt: v.optional(v.number()),
  })
    .index("by_city", ["cityId"])
    .index("by_category", ["category"])
    .index("by_subcategory", ["subcategory"])
    .index("by_external_id", ["externalId"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_city_category", ["cityId", "category"]),

  // Feed activity (denormalized for fast reads)
  feedItems: defineTable({
    type: v.union(
      v.literal("new_opportunity"),
      v.literal("price_drop"),
      v.literal("hot_deal"),
      v.literal("market_alert")
    ),
    title: v.string(),
    cityId: v.id("cities"),
    cityName: v.string(),
    country: v.string(),
    category: v.string(),
    opportunityId: v.optional(v.id("opportunities")),
    priceInfo: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_city_created", ["cityId", "createdAt"])
    .index("by_country_created", ["country", "createdAt"])
    .index("by_category_created", ["category", "createdAt"]),

  // Newsletter subscribers
  subscribers: defineTable({
    email: v.string(),
    source: v.string(),
    interests: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Analytics events
  analyticsEvents: defineTable({
    eventType: v.string(),
    eventData: v.any(),
    sessionId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_type_created", ["eventType", "createdAt"]),

  // User preferences (for returning users)
  userPreferences: defineTable({
    userId: v.optional(v.string()),
    visitorId: v.string(),
    hasSeenOnboarding: v.boolean(),
    bookmarkedCities: v.array(v.id("cities")),
    preferredCategories: v.array(v.string()),
    lastVisit: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_visitor", ["visitorId"]),

  // Users table (synced from Clerk)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // User bookmarks (requires auth)
  bookmarks: defineTable({
    userId: v.id("users"),
    cityId: v.id("cities"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_city", ["userId", "cityId"]),

  // Ingest cache to avoid refetching too frequently
  ingestCache: defineTable({
    key: v.string(),         // e.g., "pokemon" or "onepiece"
    lastFetched: v.number(), // timestamp in ms
  }).index("by_key", ["key"]),
});
