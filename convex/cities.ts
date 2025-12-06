import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("cities").collect();
  },
});

export const getByCountry = query({
  args: { country: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cities")
      .withIndex("by_country", (q) => q.eq("country", args.country))
      .collect();
  },
});

export const getById = query({
  args: { cityId: v.id("cities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cityId);
  },
});

export const seed = mutation({
  handler: async (ctx) => {
    // Check if cities already exist
    const existing = await ctx.db.query("cities").first();
    if (existing) {
      return { message: "Cities already seeded" };
    }

    const cities = [
      // Malaysia
      {
        name: "Kuala Lumpur",
        country: "MY",
        countryName: "Malaysia",
        coordinates: { lat: 3.139, lng: 101.6869 },
        opportunityCount: 24,
        activityLevel: "hot" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Penang",
        country: "MY",
        countryName: "Malaysia",
        coordinates: { lat: 5.4164, lng: 100.3327 },
        opportunityCount: 12,
        activityLevel: "warm" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Johor Bahru",
        country: "MY",
        countryName: "Malaysia",
        coordinates: { lat: 1.4927, lng: 103.7414 },
        opportunityCount: 18,
        activityLevel: "warm" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Ipoh",
        country: "MY",
        countryName: "Malaysia",
        coordinates: { lat: 4.5975, lng: 101.0901 },
        opportunityCount: 5,
        activityLevel: "normal" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Kota Kinabalu",
        country: "MY",
        countryName: "Malaysia",
        coordinates: { lat: 5.9804, lng: 116.0735 },
        opportunityCount: 3,
        activityLevel: "cold" as const,
        lastUpdated: Date.now(),
      },

      // Singapore
      {
        name: "Singapore",
        country: "SG",
        countryName: "Singapore",
        coordinates: { lat: 1.3521, lng: 103.8198 },
        opportunityCount: 45,
        activityLevel: "hot" as const,
        lastUpdated: Date.now(),
      },

      // Japan
      {
        name: "Tokyo",
        country: "JP",
        countryName: "Japan",
        coordinates: { lat: 35.6762, lng: 139.6503 },
        opportunityCount: 67,
        activityLevel: "hot" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Osaka",
        country: "JP",
        countryName: "Japan",
        coordinates: { lat: 34.6937, lng: 135.5023 },
        opportunityCount: 38,
        activityLevel: "hot" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Nagoya",
        country: "JP",
        countryName: "Japan",
        coordinates: { lat: 35.1815, lng: 136.9066 },
        opportunityCount: 15,
        activityLevel: "warm" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Fukuoka",
        country: "JP",
        countryName: "Japan",
        coordinates: { lat: 33.5902, lng: 130.4017 },
        opportunityCount: 11,
        activityLevel: "warm" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Sapporo",
        country: "JP",
        countryName: "Japan",
        coordinates: { lat: 43.0618, lng: 141.3545 },
        opportunityCount: 8,
        activityLevel: "normal" as const,
        lastUpdated: Date.now(),
      },
      {
        name: "Kyoto",
        country: "JP",
        countryName: "Japan",
        coordinates: { lat: 35.0116, lng: 135.7681 },
        opportunityCount: 22,
        activityLevel: "warm" as const,
        lastUpdated: Date.now(),
      },
    ];

    for (const city of cities) {
      await ctx.db.insert("cities", city);
    }

    return { message: `Seeded ${cities.length} cities` };
  },
});
