# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PikaEdge Map Explorer** is an interactive platform that enables arbitrage enthusiasts to visually track and discover trending items across Malaysia, Singapore, and Japan. Users can explore metro cities on an interactive map, view real-time arbitrage opportunities, and filter by country and product categories.

For detailed specifications, see `spec/pika-edge.md` and `IMPLEMENTATION_PLAN.md`.

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Development server:**
```bash
npm run dev           # Start Next.js dev server (http://localhost:3000)
npx convex dev        # Start Convex backend (run in separate terminal)
```

**Build and production:**
```bash
npm run build         # Create production build
npm run start         # Run production server (requires build first)
npx convex deploy     # Deploy Convex functions to production
```

**Linting:**
```bash
npm run lint                  # Lint entire project
npm run lint -- app/page.tsx  # Lint specific file
```

**shadcn/ui component installation:**
```bash
# Initialize shadcn/ui (first time only)
npx shadcn@latest init

# Add individual components
npx shadcn@latest add button card dialog dropdown-menu input popover scroll-area select sheet skeleton tabs toast

# Add shadcn-map for interactive maps
pnpm dlx shadcn@latest add @shadcn-map/map
```

Note: No test framework is currently configured in this project.

## Tech Stack

### Core Framework
- **Next.js 16** with App Router (`app/` directory)
- **React 19**
- **TypeScript** (strict mode, bundler module resolution)
- **Tailwind CSS v4** (CSS-first configuration via `@tailwindcss/postcss`)
- **ESLint 9** with `eslint-config-next`

### Backend & Real-time Data
- **Convex** - Real-time database and serverless functions
- **Clerk** - Authentication (progressive auth model)

### UI Components & Mapping
- **shadcn/ui** - Accessible component library built on Radix UI
- **shadcn-map** - React Leaflet wrapper for interactive maps
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **next-themes** - Theme management

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>

# Clerk JWT for Convex (also configure in Convex dashboard)
# CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk-domain>
```

## Project Structure

```
pika-edge/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-related routes
│   ├── map/                      # Map explorer pages
│   ├── ConvexClientProvider.tsx  # Convex + Clerk provider
│   ├── globals.css               # Global styles + Tailwind
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   └── map/                  # shadcn-map components
│   ├── map/                      # Map-specific components
│   │   ├── map-explorer.tsx      # Main map container
│   │   ├── city-tile.tsx         # City markers
│   │   └── map-legend.tsx        # Legend component
│   ├── feed/                     # Feed components
│   │   ├── global-feed.tsx       # Real-time feed panel
│   │   └── feed-item.tsx         # Feed entry
│   ├── onboarding/               # Onboarding tour
│   ├── layout/                   # Layout components
│   ├── newsletter/               # Newsletter signup
│   └── auth/                     # Auth components
├── convex/                       # Convex backend
│   ├── _generated/               # Auto-generated types
│   ├── schema.ts                 # Database schema
│   ├── auth.config.ts            # Clerk configuration
│   ├── cities.ts                 # City queries & mutations
│   ├── opportunities.ts          # Opportunity queries
│   ├── feed.ts                   # Feed functions
│   ├── bookmarks.ts              # User bookmarks
│   └── analytics.ts              # Event tracking
├── lib/
│   ├── constants/
│   │   ├── cities.ts             # City static data
│   │   └── categories.ts         # Product categories
│   ├── hooks/
│   │   ├── use-map-state.ts      # Map state management
│   │   └── use-filters.ts        # Filter state
│   └── utils/
│       ├── geo.ts                # Geolocation utilities
│       └── format.ts             # Formatting helpers
├── spec/                         # Product requirements
├── middleware.ts                 # Clerk middleware
├── components.json               # shadcn/ui config
└── convex.json                   # Convex config
```

## Architecture Overview

### App Router Structure

This project uses Next.js App Router with the following key files:

**`app/layout.tsx`** - Root layout for the entire application
- Wraps app with `ConvexClientProvider` and `ClerkProvider`
- Loads Geist and Geist Mono fonts via `next/font/google`
- Font variables: `--font-geist-sans` and `--font-geist-mono`
- Imports `globals.css` for Tailwind and global styles
- Exports app-wide metadata (title, description)
- All routes render within this layout's `children` prop

**`app/ConvexClientProvider.tsx`** - Convex and Clerk integration
- Client component wrapping app with real-time database access
- Combines `ConvexProviderWithClerk` for authenticated queries
- Provides `useQuery`, `useMutation`, `useAuth` hooks throughout app

**`app/page.tsx`** - Home/landing page at `/`
- React Server Component by default
- Entry point for users before navigating to map

**`app/map/page.tsx`** - Main map explorer interface
- Interactive map with city tiles
- Real-time feed sidebar
- Filter controls

**`app/globals.css`** - Global styles and Tailwind theme
- Imports Tailwind v4 via `@import "tailwindcss";`
- Design tokens in CSS variables on `:root`: `--background`, `--foreground`
- Dark mode via `@media (prefers-color-scheme: dark)` (not class-based)
- Tailwind v4 `@theme inline` block maps CSS variables to Tailwind utilities
- Font variables (`--font-sans`, `--font-mono`) linked to Geist fonts from layout

### Convex Backend Architecture

**`convex/schema.ts`** - Database schema definition
- Tables: `cities`, `opportunities`, `feedItems`, `subscribers`, `users`, `bookmarks`, `analyticsEvents`, `userPreferences`
- Indexes optimized for real-time queries
- Type-safe schema with `defineTable` and validators

**Convex Functions:**
- **Queries** (`query()`) - Read data, automatically reactive
- **Mutations** (`mutation()`) - Write data, trigger reactivity
- **Actions** (`action()`) - External API calls, side effects

### Authentication Architecture

**Progressive Authentication Model:**
- Anonymous users have full read access to map and feed
- Authenticated users can bookmark cities and sync preferences
- Uses Clerk for authentication with Convex integration

**Auth Flow:**
1. `middleware.ts` - Clerk middleware for route protection
2. `convex/auth.config.ts` - JWT verification config
3. `ctx.auth.getUserIdentity()` in Convex functions - Check auth status

### Configuration Files

**`next.config.ts`** - Next.js configuration
- Currently uses framework defaults
- Modify here for experimental flags, redirects, headers, etc.

**`convex.json`** - Convex project configuration
- Generated when running `npx convex dev`
- Links to Convex deployment

**`components.json`** - shadcn/ui configuration
- Component installation settings
- Path aliases for components
- Styling preferences (Tailwind, CSS variables)

**`eslint.config.mjs`** - ESLint configuration
- Uses `eslint-config-next` with `core-web-vitals` and TypeScript presets
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**`tsconfig.json`** - TypeScript configuration
- Path alias: `@/*` maps to `./*` for root-relative imports
- Strict mode enabled
- Bundler module resolution

## Styling with Tailwind v4

This project uses Tailwind CSS v4's **CSS-first configuration** model:

- **No `tailwind.config.js`** file exists
- All theme configuration lives in `app/globals.css` via the `@theme` block
- To customize design tokens (colors, fonts, spacing), extend the `@theme` block
- Custom utilities/variants can be added via `@utility`, `@variant`, `@plugin` directives in CSS files
- Dark mode uses media query strategy, not class-based toggling
- shadcn/ui components use CSS variables for theming

## Key Patterns

### Adding New Routes
Create files under `app/` following App Router conventions:
- `app/about/page.tsx` → `/about` route
- `app/map/[cityId]/page.tsx` → `/map/:cityId` dynamic route
- Use `(folderName)` for route groups that don't affect URL structure

### Working with Convex

**Querying data (reactive):**
```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function MyComponent() {
  const cities = useQuery(api.cities.list);

  if (cities === undefined) return <div>Loading...</div>;

  return <div>{cities.map(city => <div key={city._id}>{city.name}</div>)}</div>;
}
```

**Mutating data:**
```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function MyComponent() {
  const addBookmark = useMutation(api.bookmarks.add);

  const handleClick = async () => {
    await addBookmark({ cityId: "someId" });
  };

  return <button onClick={handleClick}>Bookmark</button>;
}
```

**Writing Convex functions:**
```typescript
// convex/myFunctions.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tableName").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tableName", { name: args.name });
  },
});
```

### Authentication with Clerk

**Check auth status:**
```typescript
"use client";

import { useUser } from "@clerk/nextjs";

export function MyComponent() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Hello {user.firstName}</div>;
}
```

**Protected Convex functions:**
```typescript
// convex/myFunctions.ts
export const protectedMutation = mutation({
  args: { data: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in");

    // Proceed with authenticated logic
  },
});
```

### Using shadcn/ui Components

**Install a component:**
```bash
npx shadcn@latest add button
```

**Use the component:**
```typescript
import { Button } from "@/components/ui/button";

export function MyComponent() {
  return <Button variant="outline">Click me</Button>;
}
```

**Customize component styles:**
Edit the component file in `components/ui/` or use className prop with Tailwind classes.

### Working with shadcn-map

**Basic map setup:**
```typescript
import { Map, MapTileLayer, MapMarker } from "@/components/ui/map";

export function MapExplorer() {
  return (
    <Map center={[3.139, 101.687]} zoom={5}>
      <MapTileLayer />
      <MapMarker position={[3.139, 101.687]}>
        <div>Marker content</div>
      </MapMarker>
    </Map>
  );
}
```

### Importing with Path Aliases
```typescript
import { Component } from '@/components/Component'
import { api } from '@/convex/_generated/api'
import { INITIAL_CITIES } from '@/lib/constants/cities'
```

### Using Next.js Image Component
```typescript
import Image from "next/image"

<Image
  src="/image.svg"
  alt="Description"
  width={100}
  height={100}
  priority  // For above-the-fold images
/>
```

### Font Usage
Geist fonts are pre-configured. Access via Tailwind classes that reference the CSS variables:
- Sans font: automatically applied via `font-sans` class
- Mono font: use `font-mono` class

## Static Assets

Place static files in `public/` and reference them with root-relative paths:
```typescript
<Image src="/logo.svg" alt="Logo" width={100} height={100} />
```

## Real-time Subscriptions

Convex provides automatic real-time updates:
- `useQuery` hooks automatically re-render when data changes
- No manual polling or WebSocket setup required
- Updates are pushed from server to client instantly

## Database Schema

Key tables (see `convex/schema.ts` for full schema):

- **cities** - Metro tiles (MY/SG/JP cities)
- **opportunities** - Arbitrage opportunities
- **feedItems** - Real-time activity feed (denormalized)
- **subscribers** - Newsletter signups
- **users** - Clerk user sync
- **bookmarks** - User-saved cities (requires auth)
- **analyticsEvents** - Event tracking
- **userPreferences** - User settings and onboarding state

## Common Development Tasks

### Adding a new city
1. Update `lib/constants/cities.ts` with city data
2. Run seed script or manually insert into Convex dashboard

### Adding a new product category
1. Update `lib/constants/categories.ts`
2. Ensure category is used in opportunity filtering

### Adding a new shadcn/ui component
```bash
npx shadcn@latest add [component-name]
```

### Deploying to production
```bash
# Build Next.js
npm run build

# Deploy Convex backend
npx convex deploy

# Deploy Next.js to Vercel
vercel deploy --prod
```

## Performance Considerations

- Use Convex indexes for frequently queried fields
- Implement pagination for large lists (use `.take()` or `.paginate()`)
- Use skeleton loaders during data fetching
- Optimize images with Next.js Image component
- Cache map tiles on client side

## Troubleshooting

**Convex not connecting:**
- Ensure `npx convex dev` is running
- Check `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
- Verify Convex project is initialized (`convex.json` exists)

**Clerk authentication issues:**
- Verify environment variables are set
- Check `middleware.ts` is configured correctly
- Ensure JWT template is created in Clerk dashboard

**shadcn/ui components not found:**
- Run `npx shadcn@latest init` first
- Install specific components with `npx shadcn@latest add [name]`

**Map not rendering:**
- Ensure Leaflet CSS is imported
- Check that map container has defined height
- Verify coordinates are in correct format `[lat, lng]`
