# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

- Install dependencies (uses npm, since `package-lock.json` is checked in):
  - `npm install`
- Run the Next.js dev server (http://localhost:3000):
  - `npm run dev`
- Run the Convex dev server (in a separate terminal):
  - `npx convex dev`
- Generate Convex types after schema/function changes:
  - `npx convex codegen`
- Create a production build:
  - `npm run build`
- Run the production server (after `npm run build`):
  - `npm run start`
- Lint the entire project using ESLint + `eslint-config-next`:
  - `npm run lint`
- Lint a single file or directory (example):
  - `npm run lint -- app/page.tsx`
- Deploy Convex functions:
  - `npx convex deploy`
- Deploy Next.js (optional, if using Vercel):
  - `vercel deploy --prod`

Testing is **not** configured yet (no `test` script or Jest/Vitest config is present as of this version of the repo).

### One-time scaffolding (when adding UI components)

- Initialize shadcn/ui:
  - `npx shadcn@latest init`
- Add commonly used shadcn/ui components:
  - `npx shadcn@latest add button card dialog dropdown-menu input popover scroll-area select sheet skeleton tabs toast`
- Add the shadcn-map wrapper (React Leaflet):
  - `npx shadcn@latest add @shadcn-map/map`

## Environment setup

Create `.env.local` with at least:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

# Clerk (optional for V1; required for bookmarks/synced prefs)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
# For Convex auth config (set in Convex dashboard)
# CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk-domain>
```

## Stack and tooling

- **Framework**: Next.js 16 (App Router) with React 19.
- **Language**: TypeScript with `strict` mode enabled and bundler-style module resolution.
- **Styling**: Tailwind CSS v4 via CSS-first configuration in `app/globals.css` and PostCSS plugin `@tailwindcss/postcss` (see `postcss.config.mjs`).
- **UI components**: shadcn/ui.
- **Mapping**: shadcn-map (React Leaflet) + `leaflet`.
- **Backend**: Convex (real-time database + serverless functions).
- **Authentication**: Clerk (progressive auth model; optional for V1).
- **State/data**: Convex React hooks with real-time subscriptions.
- **Analytics**: Event logging via Convex `analyticsEvents`.
- **Fonts**: Next.js `next/font` (Geist, Geist Mono) wired via CSS variables in the root layout.
- **Linting**: ESLint 9 with `eslint-config-next` TypeScript + Core Web Vitals in `eslint.config.mjs`.
- **Path aliases**: TypeScript `paths` defines `@/*` → `./*` in `tsconfig.json`.

## Application architecture

Key files and directories used by the current implementation plan:

- **`next.config.ts`**
  - Exports a `NextConfig` object and currently relies on Next.js defaults.

- **`middleware.ts`**
  - Clerk middleware configuration and route matcher when auth is enabled.

- **`app/layout.tsx` (root layout)**
  - Imports `./globals.css`.
  - Wraps the tree with `ThemeProvider`, `ConvexClientProvider`, and optionally Clerk provider per the plan.
  - Exports `metadata` (title, description) for the entire app.

- **`app/ConvexClientProvider.tsx`**
  - Sets up the Convex React client and provider (with or without Clerk integration as configured).

- **Routes**
  - `app/page.tsx` — Landing/home page.
  - `app/map/page.tsx` — Main Map Explorer.
  - `app/map/[cityId]/page.tsx` — City details page.
  - `app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Auth routes (when Clerk enabled).

- **Components**
  - `components/map/` — `map-explorer.tsx`, `city-tile.tsx`, `map-legend.tsx`.
  - `components/feed/` — `global-feed.tsx`, `feed-item.tsx`, `feed-filters.tsx`.
  - `components/layout/` — `header.tsx`, `sidebar.tsx`, `mobile-nav.tsx`.
  - `components/newsletter/` — `signup-modal.tsx`.
  - `components/auth/` — `auth-button.tsx` (uses Clerk when enabled).
  - `components/ui/` — shadcn/ui primitives and `ui/map` from shadcn-map.

- **Convex backend (`convex/`)**
  - `schema.ts` — DB schema for cities, opportunities, feedItems, subscribers, analyticsEvents, users, bookmarks, userPreferences.
  - Functions: `cities.ts`, `opportunities.ts`, `feed.ts`, `subscribers.ts`, `analytics.ts`, `bookmarks.ts`.
  - `auth.config.ts` — Clerk JWT configuration for Convex.

- **`app/globals.css` (global styles and Tailwind theme)**
  - Imports Tailwind v4 via `@import "tailwindcss";`.
  - Maps design tokens with `@theme inline` and sets base styles (light/dark via `prefers-color-scheme`).

- **Static assets: `public/`**
  - Static images and icons used across the app.

## Linting configuration details

- **`eslint.config.mjs`**
  - Uses `defineConfig` from `eslint/config` and composes `eslint-config-next` (Core Web Vitals + TypeScript).
  - Overrides ignores using `globalIgnores` for `.next/**`, `out/**`, `build/**`, and `next-env.d.ts`.
  - Run `npm run lint` for the full suite; use `npm run lint -- <file-or-dir>` for targeted linting.

## Tailwind CSS v4 notes

- Tailwind is configured **entirely via CSS** (no `tailwind.config.js`), following Tailwind v4’s CSS‑first model.
- Extend the `@theme` block in `app/globals.css` to adjust tokens (colors, fonts, spacing, etc.).
- Add global utilities/variants via Tailwind’s CSS directives (`@utility`, `@variant`, `@plugin`) in CSS files as needed.
