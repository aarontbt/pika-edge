# PikaEdge Map Explorer V1 - Implementation Plan

## Overview

This document outlines the technical implementation plan for PikaEdge Map Explorer V1 based on the PRD requirements. The platform enables arbitrage enthusiasts to visually track and discover trending items across Malaysia, Singapore, and Japan.

**Tech Stack:**
- **Frontend:** Next.js 16 + React 19 + TypeScript
- **UI Components:** shadcn/ui + Tailwind CSS v4
- **Mapping:** shadcn-map (React Leaflet wrapper)
- **Backend:** Convex (real-time database + serverless functions)
- **Authentication:** Clerk (optional for V1, progressive auth model)
- **State Management:** Convex React hooks (real-time subscriptions)

---

## Project Structure

```
pika-edge/
├── app/
│   ├── (auth)/                    # Auth-related pages
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── api/                       # API routes (if needed)
│   ├── map/                       # Main map explorer page
│   │   ├── page.tsx
│   │   └── [cityId]/page.tsx      # City detail page
│   ├── ConvexClientProvider.tsx   # Convex + Clerk provider wrapper
│   ├── globals.css                # Global styles + Tailwind
│   ├── layout.tsx                 # Root layout with providers
│   └── page.tsx                   # Landing/home page
├── middleware.ts                  # Clerk middleware
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── map/                   # shadcn-map components
│   │   │   └── (installed via CLI)
│   │   ├── popover.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   └── toast.tsx
│   ├── map/                       # Map-specific components
│   │   ├── map-explorer.tsx       # Main map container
│   │   ├── city-tile.tsx          # Clickable metro tile
│   │   ├── opportunity-marker.tsx # Custom marker component
│   │   └── map-legend.tsx         # Color coding legend
│   ├── feed/                      # Feed components
│   │   ├── global-feed.tsx        # Real-time feed panel
│   │   ├── feed-item.tsx          # Individual feed entry
│   │   └── feed-filters.tsx       # Filter controls
│   ├── onboarding/                # Onboarding components
│   │   ├── onboarding-tour.tsx    # First-time user tour
│   │   └── tour-step.tsx          # Individual tour step
│   ├── layout/                    # Layout components
│   │   ├── header.tsx             # App header
│   │   ├── sidebar.tsx            # Filter sidebar
│   │   └── mobile-nav.tsx         # Mobile navigation
│   ├── newsletter/                # Engagement components
│   │   └── signup-modal.tsx       # Newsletter opt-in modal
│   └── auth/                      # Authentication components
│       ├── auth-button.tsx        # Sign in/out button
│       └── bookmark-button.tsx    # Bookmark with auth check
├── convex/                        # Convex backend
│   ├── _generated/                # Auto-generated types
│   ├── auth.config.ts             # Clerk auth configuration
│   ├── schema.ts                  # Database schema
│   ├── cities.ts                  # City/metro queries & mutations
│   ├── opportunities.ts           # Opportunity queries
│   ├── feed.ts                    # Real-time feed functions
│   ├── subscribers.ts             # Newsletter subscriptions
│   ├── bookmarks.ts               # User bookmarks (requires auth)
│   ├── users.ts                   # User management (Clerk sync)
│   └── analytics.ts               # Event tracking
├── lib/
│   ├── constants/
│   │   ├── cities.ts              # City/metro static data
│   │   └── categories.ts          # Product categories
│   ├── hooks/
│   │   ├── use-map-state.ts       # Map interaction state
│   │   ├── use-onboarding.ts      # Onboarding state
│   │   └── use-filters.ts         # Filter state management
│   └── utils/
│       ├── geo.ts                 # Geolocation utilities
│       └── format.ts              # Data formatting helpers
├── public/
│   └── images/                    # Static assets
├── spec/
│   └── pika-edge.md              # PRD document
├── .env.local                     # Environment variables
├── components.json                # shadcn/ui config
├── convex.json                    # Convex config
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Database Schema (Convex)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Metro cities/tiles
  cities: defineTable({
    name: v.string(),                          // e.g., "Kuala Lumpur"
    country: v.string(),                       // MY, SG, JP
    countryName: v.string(),                   // Malaysia, Singapore, Japan
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    opportunityCount: v.number(),              // Active opportunities
    activityLevel: v.union(                    // For color coding
      v.literal("hot"),
      v.literal("warm"),
      v.literal("normal"),
      v.literal("cold")
    ),
    lastUpdated: v.number(),                   // Timestamp
  })
    .index("by_country", ["country"])
    .index("by_activity", ["activityLevel"]),

  // Arbitrage opportunities
  opportunities: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    cityId: v.id("cities"),
    category: v.string(),                      // electronics, sneakers, etc.
    priceLocal: v.number(),
    priceCurrency: v.string(),
    priceSpread: v.optional(v.number()),       // % difference vs reference
    referenceCity: v.optional(v.string()),     // City for price comparison
    sourceUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("sold")
    ),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_city", ["cityId"])
    .index("by_category", ["category"])
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
    source: v.string(),                        // "newsletter", "demo_request"
    interests: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  // Analytics events
  analyticsEvents: defineTable({
    eventType: v.string(),                     // tile_click, feed_click, etc.
    eventData: v.any(),
    sessionId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_type_created", ["eventType", "createdAt"]),

  // User preferences (optional - for returning users)
  userPreferences: defineTable({
    visitorId: v.string(),                     // Anonymous visitor ID
    hasSeenOnboarding: v.boolean(),
    bookmarkedCities: v.array(v.id("cities")),
    preferredCategories: v.array(v.string()),
    lastVisit: v.number(),
  })
    .index("by_visitor", ["visitorId"]),
});
```

---

## Authentication Strategy

### Overview

PikaEdge V1 uses a **progressive authentication** model:
- **Anonymous users:** Full access to map, feed, and filters
- **Authenticated users:** Additional features like bookmarking and cross-device preferences

### Why Clerk?

Clerk is the recommended auth provider for Convex with:
- First-class Convex integration
- Pre-built UI components (SignIn, SignUp, UserButton)
- Social logins (Google, GitHub, etc.)
- Email/password and magic links
- Excellent developer experience

### Authentication Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App                            │
├─────────────────────────────────────────────────────────────┤
│  ClerkProvider                                              │
│  ├── ConvexProviderWithClerk                               │
│  │   ├── Public Routes (no auth required)                  │
│  │   │   ├── / (Landing)                                   │
│  │   │   ├── /map (Map Explorer - full access)             │
│  │   │   └── /map/[cityId] (City details)                  │
│  │   │                                                      │
│  │   └── Protected Features (auth enhances experience)     │
│  │       ├── Bookmark cities                               │
│  │       ├── Save filter preferences                       │
│  │       └── Sync across devices                           │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Files

```typescript
// convex/auth.config.ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

```typescript
// app/ConvexClientProvider.tsx
"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexClerkProvider>{children}</ConvexClerkProvider>
    </ClerkProvider>
  );
}
```

```typescript
// middleware.ts (Next.js middleware for Clerk)
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Database Schema Updates for Auth

```typescript
// convex/schema.ts - Add to existing schema

// Users table (synced from Clerk)
users: defineTable({
  clerkId: v.string(),              // Clerk user ID
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

// Update userPreferences to link to users
userPreferences: defineTable({
  userId: v.optional(v.id("users")),   // Optional - null for anonymous
  visitorId: v.string(),               // Anonymous visitor ID (fallback)
  hasSeenOnboarding: v.boolean(),
  bookmarkedCities: v.array(v.id("cities")),
  preferredCategories: v.array(v.string()),
  lastVisit: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_visitor", ["visitorId"]),
```

### Convex Functions with Optional Auth

```typescript
// convex/bookmarks.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user's bookmarks (requires auth)
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Add bookmark (requires auth)
export const add = mutation({
  args: { cityId: v.id("cities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in to bookmark");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if already bookmarked
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_city", (q) =>
        q.eq("userId", user._id).eq("cityId", args.cityId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("bookmarks", {
      userId: user._id,
      cityId: args.cityId,
      createdAt: Date.now(),
    });
  },
});

// Remove bookmark (requires auth)
export const remove = mutation({
  args: { cityId: v.id("cities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_city", (q) =>
        q.eq("userId", user._id).eq("cityId", args.cityId)
      )
      .first();

    if (bookmark) {
      await ctx.db.delete(bookmark._id);
    }
  },
});
```

### UI Components for Auth

```typescript
// components/auth/auth-button.tsx
"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <Button variant="ghost" disabled>Loading...</Button>;
  }

  if (isSignedIn) {
    return <UserButton afterSignOutUrl="/" />;
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm">Sign In</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button size="sm">Sign Up</Button>
      </SignUpButton>
    </div>
  );
}
```

```typescript
// components/map/bookmark-button.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";

interface BookmarkButtonProps {
  cityId: Id<"cities">;
  cityName: string;
}

export function BookmarkButton({ cityId, cityName }: BookmarkButtonProps) {
  const { isSignedIn } = useUser();
  const bookmarks = useQuery(api.bookmarks.list);
  const addBookmark = useMutation(api.bookmarks.add);
  const removeBookmark = useMutation(api.bookmarks.remove);

  const isBookmarked = bookmarks?.some((b) => b.cityId === cityId);

  const handleToggle = async () => {
    if (isBookmarked) {
      await removeBookmark({ cityId });
      toast.success(`Removed ${cityName} from bookmarks`);
    } else {
      await addBookmark({ cityId });
      toast.success(`Added ${cityName} to bookmarks`);
    }
  };

  // Show sign-in prompt for anonymous users
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" size="sm">
          <Bookmark className="h-4 w-4 mr-1" />
          Sign in to bookmark
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      variant={isBookmarked ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
    >
      {isBookmarked ? (
        <>
          <BookmarkCheck className="h-4 w-4 mr-1" />
          Bookmarked
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4 mr-1" />
          Bookmark
        </>
      )}
    </Button>
  );
}
```

### Environment Variables for Auth

```env
# .env.local

# Convex
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>

# Clerk JWT for Convex (set in Convex dashboard)
# CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk-domain>
```

### Feature Access Matrix

| Feature | Anonymous | Authenticated |
|---------|-----------|---------------|
| View map & tiles | ✅ | ✅ |
| View global feed | ✅ | ✅ |
| Filter by country/category | ✅ | ✅ |
| View opportunity details | ✅ | ✅ |
| Bookmark cities | ❌ | ✅ |
| Save filter preferences | Local only | ✅ Synced |
| Skip onboarding tour | Local only | ✅ Synced |
| Newsletter signup | ✅ | ✅ (pre-filled email) |

### Setup Steps (Phase 1)

1. **Create Clerk account** at [clerk.com](https://clerk.com)
2. **Create application** in Clerk dashboard
3. **Create JWT template** named "convex" in Clerk
4. **Add environment variables** to `.env.local` and Convex dashboard
5. **Install Clerk SDK:**
   ```bash
   npm install @clerk/nextjs
   ```
6. **Configure `auth.config.ts`** in Convex
7. **Update providers** in root layout

---

## Implementation Phases

### Phase 1: Foundation & Core Map (Week 1)

#### 1.1 Project Setup (Day 1)

**Tasks:**
- [ ] Initialize Convex project
- [ ] Install and configure shadcn/ui
- [ ] Install shadcn-map component
- [ ] Set up project structure
- [ ] Configure environment variables
- [ ] Set up Convex schema

**Commands:**
```bash
# Install Convex
npm install convex
npx convex dev  # Initialize Convex project

# Initialize shadcn/ui
npx shadcn@latest init

# Add required shadcn components
npx shadcn@latest add button card dialog dropdown-menu input popover scroll-area select sheet skeleton tabs toast

# Install shadcn-map
pnpm dlx shadcn@latest add @shadcn-map/map

# Install additional dependencies
npm install next-themes sonner lucide-react
```

**Environment Variables (.env.local):**
```env
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
```

#### 1.2 Convex Provider Setup (Day 1)

```typescript
// app/ConvexClientProvider.tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

#### 1.3 Base Layout (Day 1-2)

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PikaEdge Map Explorer",
  description: "Discover arbitrage opportunities across MY/SG/JP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ConvexClientProvider>
            {children}
            <Toaster />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### 1.4 Map Rendering (Day 2-3)

**Main Map Component:**
```typescript
// components/map/map-explorer.tsx
"use client";

import { Map, MapTileLayer, MapMarker, MapPopup } from "@/components/ui/map";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CityTile } from "./city-tile";
import { MapLegend } from "./map-legend";

const MAP_CENTER = [4.2105, 101.9758]; // Center of MY/SG/JP region
const DEFAULT_ZOOM = 5;

export function MapExplorer() {
  const cities = useQuery(api.cities.list);

  if (!cities) {
    return <MapSkeleton />;
  }

  return (
    <div className="relative h-full w-full">
      <Map center={MAP_CENTER} zoom={DEFAULT_ZOOM}>
        <MapTileLayer />
        {cities.map((city) => (
          <CityTile key={city._id} city={city} />
        ))}
      </Map>
      <MapLegend />
    </div>
  );
}
```

#### 1.5 City Tiles (Day 3-4)

```typescript
// components/map/city-tile.tsx
"use client";

import { MapMarker, MapPopup } from "@/components/ui/map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";

interface CityTileProps {
  city: Doc<"cities">;
  onSelect?: (cityId: string) => void;
}

const activityColors = {
  hot: "bg-red-500",
  warm: "bg-orange-400",
  normal: "bg-blue-400",
  cold: "bg-gray-400",
};

export function CityTile({ city, onSelect }: CityTileProps) {
  return (
    <MapMarker
      position={[city.coordinates.lat, city.coordinates.lng]}
      icon={
        <div
          className={`h-6 w-6 rounded-full ${activityColors[city.activityLevel]}
            flex items-center justify-center text-xs text-white font-bold
            shadow-lg border-2 border-white cursor-pointer
            hover:scale-110 transition-transform`}
        >
          {city.opportunityCount}
        </div>
      }
    >
      <MapPopup className="w-64">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              {city.name}
              <Badge variant={city.activityLevel === "hot" ? "destructive" : "secondary"}>
                {city.activityLevel}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{city.countryName}</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{city.opportunityCount}</p>
            <p className="text-sm text-muted-foreground">Active opportunities</p>
            <Button
              className="w-full mt-3"
              onClick={() => onSelect?.(city._id)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      </MapPopup>
    </MapMarker>
  );
}
```

#### 1.6 Convex Queries (Day 4-5)

```typescript
// convex/cities.ts
import { query } from "./_generated/server";
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
```

```typescript
// convex/opportunities.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const listByCity = query({
  args: {
    cityId: v.id("cities"),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("opportunities")
      .withIndex("by_city", (q) => q.eq("cityId", args.cityId));

    const opportunities = await q.collect();

    const filtered = args.category
      ? opportunities.filter(o => o.category === args.category)
      : opportunities;

    return filtered
      .filter(o => o.status === "active")
      .slice(0, args.limit ?? 20);
  },
});
```

---

### Phase 2: Feed & Filtering (Week 2)

#### 2.1 Global Feed Component (Day 1-2)

```typescript
// components/feed/global-feed.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeedItem } from "./feed-item";
import { FeedFilters } from "./feed-filters";
import { useState } from "react";

export function GlobalFeed() {
  const [filters, setFilters] = useState({
    country: null,
    category: null,
  });

  const feedItems = useQuery(api.feed.list, {
    country: filters.country,
    category: filters.category,
    limit: 50,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Live Activity</h2>
        <FeedFilters filters={filters} onFiltersChange={setFilters} />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {feedItems?.map((item) => (
            <FeedItem key={item._id} item={item} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

#### 2.2 Feed Item Component (Day 2)

```typescript
// components/feed/feed-item.tsx
"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, AlertTriangle, Sparkles, Bell } from "lucide-react";

const typeIcons = {
  new_opportunity: Sparkles,
  price_drop: TrendingUp,
  hot_deal: AlertTriangle,
  market_alert: Bell,
};

const typeColors = {
  new_opportunity: "bg-green-100 text-green-800",
  price_drop: "bg-blue-100 text-blue-800",
  hot_deal: "bg-red-100 text-red-800",
  market_alert: "bg-yellow-100 text-yellow-800",
};

interface FeedItemProps {
  item: Doc<"feedItems">;
  onJumpToMap?: (cityId: string) => void;
}

export function FeedItem({ item, onJumpToMap }: FeedItemProps) {
  const Icon = typeIcons[item.type];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onJumpToMap?.(item.cityId)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${typeColors[item.type]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {item.cityName}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {item.category}
              </Badge>
            </div>
            {item.priceInfo && (
              <p className="text-sm text-muted-foreground mt-1">
                {item.priceInfo}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 2.3 Filtering System (Day 3-4)

```typescript
// convex/feed.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    country: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query("feedItems")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit ?? 50);

    if (args.country) {
      items = items.filter(item => item.country === args.country);
    }

    if (args.category) {
      items = items.filter(item => item.category === args.category);
    }

    return items;
  },
});
```

#### 2.4 Mobile Responsive Design (Day 4-5)

```typescript
// components/layout/responsive-layout.tsx
"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Filter } from "lucide-react";
import { useState } from "react";
import { GlobalFeed } from "../feed/global-feed";
import { FilterSidebar } from "./filter-sidebar";

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const [feedOpen, setFeedOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b">
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <FilterSidebar />
          </SheetContent>
        </Sheet>

        <h1 className="font-bold">PikaEdge</h1>

        <Sheet open={feedOpen} onOpenChange={setFeedOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <GlobalFeed />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filters (Desktop) */}
        <aside className="hidden md:block w-64 border-r">
          <FilterSidebar />
        </aside>

        {/* Main Map Area */}
        <main className="flex-1">{children}</main>

        {/* Right Sidebar - Feed (Desktop) */}
        <aside className="hidden lg:block w-80 border-l">
          <GlobalFeed />
        </aside>
      </div>
    </div>
  );
}
```

---

### Phase 3: Onboarding & Engagement (Week 3)

#### 3.1 Onboarding Tour (Day 1-2)

```typescript
// components/onboarding/onboarding-tour.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const TOUR_STEPS = [
  {
    title: "Welcome to PikaEdge Map Explorer",
    description: "Discover arbitrage opportunities across Malaysia, Singapore, and Japan.",
    image: "/onboarding/welcome.svg",
  },
  {
    title: "Interactive City Tiles",
    description: "Click on any metro tile to see active opportunities. Tile colors indicate activity levels.",
    image: "/onboarding/tiles.svg",
  },
  {
    title: "Real-time Feed",
    description: "Stay updated with the global activity feed showing the latest deals and market movements.",
    image: "/onboarding/feed.svg",
  },
  {
    title: "Filter & Discover",
    description: "Use filters to narrow down by country, city, or product category.",
    image: "/onboarding/filters.svg",
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);

  const visitorId = useVisitorId();
  const preferences = useQuery(api.preferences.get, { visitorId });
  const updatePreferences = useMutation(api.preferences.update);

  useEffect(() => {
    if (preferences && !preferences.hasSeenOnboarding) {
      setOpen(true);
    }
  }, [preferences]);

  const handleComplete = async () => {
    await updatePreferences({
      visitorId,
      hasSeenOnboarding: true,
    });
    setOpen(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-6">
          <img src={step.image} alt={step.title} className="h-40" />
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={isLastStep ? handleComplete : () => setCurrentStep(s => s + 1)}>
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3.2 Newsletter Signup Modal (Day 2-3)

```typescript
// components/newsletter/signup-modal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

export function SignupModal({ open, onOpenChange, source = "newsletter" }: SignupModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = useMutation(api.subscribers.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await subscribe({ email, source });
      toast.success("You're subscribed! We'll be in touch.");
      onOpenChange(false);
      setEmail("");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stay Ahead of the Market</DialogTitle>
          <DialogDescription>
            Get notified about hot deals, new features, and market insights.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3.3 Analytics Integration (Day 3-4)

```typescript
// convex/analytics.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const trackEvent = mutation({
  args: {
    eventType: v.string(),
    eventData: v.any(),
    sessionId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analyticsEvents", {
      eventType: args.eventType,
      eventData: args.eventData,
      sessionId: args.sessionId,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });
  },
});
```

```typescript
// lib/hooks/use-analytics.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback } from "react";

export function useAnalytics() {
  const track = useMutation(api.analytics.trackEvent);

  const trackEvent = useCallback(
    (eventType: string, eventData: Record<string, any> = {}) => {
      track({
        eventType,
        eventData,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
    },
    [track]
  );

  return {
    trackTileClick: (cityId: string, cityName: string) =>
      trackEvent("tile_click", { cityId, cityName }),
    trackFeedClick: (itemId: string, itemType: string) =>
      trackEvent("feed_click", { itemId, itemType }),
    trackFilterChange: (filters: Record<string, any>) =>
      trackEvent("filter_change", filters),
    trackOnboardingComplete: () =>
      trackEvent("onboarding_complete", {}),
    trackNewsletterSignup: (email: string) =>
      trackEvent("newsletter_signup", { email }),
  };
}
```

---

### Phase 4: Polish & Launch (Week 4)

#### 4.1 Performance Optimization

- [ ] Implement map tile caching
- [ ] Add skeleton loading states
- [ ] Optimize Convex queries with proper indexes
- [ ] Add error boundaries
- [ ] Implement retry logic for failed requests

#### 4.2 Accessibility

- [ ] Keyboard navigation support
- [ ] High-contrast mode for map
- [ ] ARIA labels for interactive elements
- [ ] Screen reader announcements for feed updates

#### 4.3 QA Checklist

- [ ] Test on major browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Load testing with multiple concurrent users
- [ ] Test offline behavior / poor connectivity
- [ ] Verify analytics tracking accuracy

#### 4.4 Deployment

```bash
# Deploy Convex functions
npx convex deploy

# Deploy Next.js to Vercel
vercel deploy --prod
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "convex": "^1.x",
    "@clerk/nextjs": "^6.x",
    "next": "16.0.7",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "next-themes": "^0.4.x",
    "sonner": "^1.x",
    "lucide-react": "^0.x",
    "date-fns": "^3.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-scroll-area": "^1.x",
    "@radix-ui/react-select": "^2.x",
    "@radix-ui/react-tabs": "^1.x",
    "react-leaflet": "^5.x",
    "leaflet": "^1.x",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/leaflet": "^1.x",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## City Data (Static Initial Data)

```typescript
// lib/constants/cities.ts
export const INITIAL_CITIES = [
  // Malaysia
  { name: "Kuala Lumpur", country: "MY", countryName: "Malaysia", lat: 3.1390, lng: 101.6869 },
  { name: "Penang", country: "MY", countryName: "Malaysia", lat: 5.4164, lng: 100.3327 },
  { name: "Johor Bahru", country: "MY", countryName: "Malaysia", lat: 1.4927, lng: 103.7414 },
  { name: "Ipoh", country: "MY", countryName: "Malaysia", lat: 4.5975, lng: 101.0901 },
  { name: "Kota Kinabalu", country: "MY", countryName: "Malaysia", lat: 5.9804, lng: 116.0735 },

  // Singapore
  { name: "Singapore", country: "SG", countryName: "Singapore", lat: 1.3521, lng: 103.8198 },

  // Japan
  { name: "Tokyo", country: "JP", countryName: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Osaka", country: "JP", countryName: "Japan", lat: 34.6937, lng: 135.5023 },
  { name: "Nagoya", country: "JP", countryName: "Japan", lat: 35.1815, lng: 136.9066 },
  { name: "Fukuoka", country: "JP", countryName: "Japan", lat: 33.5902, lng: 130.4017 },
  { name: "Sapporo", country: "JP", countryName: "Japan", lat: 43.0618, lng: 141.3545 },
  { name: "Kyoto", country: "JP", countryName: "Japan", lat: 35.0116, lng: 135.7681 },
];

// lib/constants/categories.ts
export const PRODUCT_CATEGORIES = [
  { id: "electronics", label: "Electronics", icon: "Laptop" },
  { id: "sneakers", label: "Sneakers", icon: "Footprints" },
  { id: "fashion", label: "Fashion", icon: "Shirt" },
  { id: "collectibles", label: "Collectibles", icon: "Trophy" },
  { id: "gaming", label: "Gaming", icon: "Gamepad2" },
  { id: "watches", label: "Watches", icon: "Watch" },
  { id: "bags", label: "Bags", icon: "ShoppingBag" },
  { id: "cosmetics", label: "Cosmetics", icon: "Sparkles" },
];
```

---

## Success Criteria

Per PRD requirements:

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
| Map tile load time | < 1.5s (p95) | Convex analytics |
| Daily tile views | > 1,500 | Event tracking |
| MAU | 1,000+ | Unique visitor tracking |
| Newsletter conversion | ≥ 10% | Subscriber/visitor ratio |
| Session engagement | 2+ tile interactions | Event tracking |
| Uptime | > 99% | Convex monitoring |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Map performance on mobile | Use tile caching, lazy load markers |
| Real-time feed overload | Implement pagination, limit query results |
| Data latency | Use Convex's real-time subscriptions |
| Initial empty state | Seed database with sample opportunities |
| Low engagement | Implement exit-intent newsletter modal |

---

## Next Steps

1. **Week 1:** Complete Phase 1 - Foundation & Core Map
2. **Week 2:** Complete Phase 2 - Feed & Filtering
3. **Week 3:** Complete Phase 3 - Onboarding & Engagement
4. **Week 4:** Complete Phase 4 - Polish & Launch

Start by running the setup commands and initializing the project structure as outlined above.
