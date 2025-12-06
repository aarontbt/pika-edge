"use node";

import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

export const dataIngestion = action({
  args: {
    query: v.optional(v.string()),
    pageLimit: v.optional(v.number()),
    cityName: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }> => {
    const result = await ctx.runAction(api.actions.ingestScryfall.ingestScryfall, {
      query: args.query,
      pageLimit: args.pageLimit,
      cityName: args.cityName,
    });

    return {
      ...result,
      message: result?.message ?? "Data ingestion complete",
    };
  },
});
