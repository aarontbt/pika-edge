import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByCity = query({
  args: {
    cityId: v.id("cities"),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_city", (q) => q.eq("cityId", args.cityId))
      .collect();

    const filtered = args.category
      ? opportunities.filter((o) => o.category === args.category)
      : opportunities;

    return filtered
      .filter((o) => o.status === "active")
      .slice(0, args.limit ?? 20);
  },
});

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("opportunities")
      .withIndex("by_status_created")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit ?? 20);
  },
});

export const getById = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.opportunityId);
  },
});

export const seed = mutation({
  handler: async (ctx) => {
    // Check if opportunities already exist
    const existing = await ctx.db.query("opportunities").first();
    if (existing) {
      return { message: "Opportunities already seeded" };
    }

    // Get all cities
    const cities = await ctx.db.query("cities").collect();
    if (cities.length === 0) {
      return { message: "Please seed cities first" };
    }

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

    const sampleOpportunities = [
      {
        title: "iPhone 15 Pro Max 256GB",
        category: "electronics",
        priceSpread: 15,
      },
      { title: "Nike Air Jordan 1 Retro", category: "sneakers", priceSpread: 25 },
      { title: "Sony WH-1000XM5", category: "electronics", priceSpread: 12 },
      { title: "Rolex Submariner Date", category: "watches", priceSpread: 8 },
      { title: "Louis Vuitton Neverfull MM", category: "bags", priceSpread: 18 },
      { title: "Pokemon Scarlet Violet Booster", category: "collectibles", priceSpread: 35 },
      { title: "PS5 Slim Console", category: "gaming", priceSpread: 10 },
      { title: "New Balance 550", category: "sneakers", priceSpread: 22 },
      { title: "SK-II Facial Treatment Essence", category: "cosmetics", priceSpread: 30 },
      { title: "Uniqlo x KAWS Collab Tee", category: "fashion", priceSpread: 45 },
      { title: "Nintendo Switch OLED", category: "gaming", priceSpread: 14 },
      { title: "Chanel Classic Flap", category: "bags", priceSpread: 20 },
    ];

    const currencies: Record<string, string> = {
      MY: "MYR",
      SG: "SGD",
      JP: "JPY",
    };

    let count = 0;
    for (const city of cities) {
      // Create 2-6 opportunities per city
      const numOpportunities = Math.floor(Math.random() * 5) + 2;

      for (let i = 0; i < numOpportunities; i++) {
        const sample =
          sampleOpportunities[Math.floor(Math.random() * sampleOpportunities.length)];
        const basePrice = Math.floor(Math.random() * 900) + 100;

        await ctx.db.insert("opportunities", {
          title: sample.title,
          description: `Great deal on ${sample.title} in ${city.name}`,
          cityId: city._id,
          category: sample.category,
          priceLocal: basePrice * (city.country === "JP" ? 150 : city.country === "SG" ? 1.35 : 4.5),
          priceCurrency: currencies[city.country],
          priceSpread: sample.priceSpread + Math.floor(Math.random() * 10) - 5,
          referenceCity: city.country === "JP" ? "Singapore" : "Tokyo",
          status: "active",
          createdAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
        count++;
      }
    }

    return { message: `Seeded ${count} opportunities` };
  },
});
