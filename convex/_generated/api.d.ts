/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_dataIngestion from "../actions/dataIngestion.js";
import type * as actions_ingestCarousell from "../actions/ingestCarousell.js";
import type * as actions_ingestEbay from "../actions/ingestEbay.js";
import type * as actions_ingestScryfall from "../actions/ingestScryfall.js";
import type * as actions_ingestTcg from "../actions/ingestTcg.js";
import type * as actions_ingestXSentiment from "../actions/ingestXSentiment.js";
import type * as cities from "../cities.js";
import type * as crons from "../crons.js";
import type * as feed from "../feed.js";
import type * as ingest from "../ingest.js";
import type * as ingestCache from "../ingestCache.js";
import type * as opportunities from "../opportunities.js";
import type * as sentiment from "../sentiment.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/dataIngestion": typeof actions_dataIngestion;
  "actions/ingestCarousell": typeof actions_ingestCarousell;
  "actions/ingestEbay": typeof actions_ingestEbay;
  "actions/ingestScryfall": typeof actions_ingestScryfall;
  "actions/ingestTcg": typeof actions_ingestTcg;
  "actions/ingestXSentiment": typeof actions_ingestXSentiment;
  cities: typeof cities;
  crons: typeof crons;
  feed: typeof feed;
  ingest: typeof ingest;
  ingestCache: typeof ingestCache;
  opportunities: typeof opportunities;
  sentiment: typeof sentiment;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
