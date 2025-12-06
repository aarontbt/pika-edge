# PikaEdge Map Explorer V1

> 🗺️ **Discover arbitrage opportunities across Malaysia, Singapore, and Japan**

PikaEdge Map Explorer offers arbitrage enthusiasts and data-driven sellers a fast, interactive map to visually track and discover trending items and price differences across major cities and metro areas. Built for power flippers and arbitrageurs to scout opportunities by geography in real-time.

![PikaEdge Map Explorer](https://img.shields.io/badge/status-in%20development-yellow)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Convex](https://img.shields.io/badge/Convex-Backend-orange)

---

## ✨ Features

### Core Features (V1)
- 🗺️ **Interactive Map Visualization** - Explore opportunities across MY, SG, and JP metros
- 📍 **City Tiles** - Click metro tiles to drill into local opportunities
- 📊 **Real-time Global Feed** - Track market shifts and new deals as they happen
- 🔍 **Smart Filtering** - Filter by country, city, or product category
- 🧠 **Social Sentiment (X.com)** - Recent X posts on item detail pages (manual refresh)
- 📱 **Mobile Responsive** - Seamless experience on desktop and mobile
- 🎯 **Onboarding Tour** - Quick introduction for first-time users

### Premium Features (Authenticated Users)
- ⭐ **Bookmark Cities** - Save your favorite metros
- 🔄 **Synced Preferences** - Access your settings across devices
- 📧 **Newsletter Access** - Early alerts and market insights

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript |
| **UI Components** | shadcn/ui + Tailwind CSS v4 |
| **Mapping** | shadcn-map (React Leaflet) |
| **Backend** | Convex (real-time database + serverless) |
| **Authentication** | Clerk (optional progressive auth) |
| **Styling** | Tailwind CSS v4 + CSS Variables |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm/pnpm/yarn
- A [Convex](https://convex.dev) account (free tier available)
- A [Clerk](https://clerk.com) account (optional, for authentication features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pika-edge
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (or link to existing)
   - Generate your `NEXT_PUBLIC_CONVEX_URL`
   - Start the Convex development server

4. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Convex (required)
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

   # Clerk (optional - for authentication features)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

   Set Firecrawl in Convex env (used for X.com sentiment; cron disabled, manual runs only):
   ```bash
   npx convex env set FIRECRAWL_API_KEY=<your-firecrawl-key>
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📋 Development

### Available Scripts

```bash
# Development
npm run dev          # Start Next.js dev server
npx convex dev       # Start Convex backend (separate terminal)

# Production Build
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Deployment
npx convex deploy    # Deploy Convex functions
vercel deploy        # Deploy Next.js to Vercel

# Manual Social Sentiment Ingestion (X.com via Firecrawl; cron currently disabled)
npx convex run actions/ingestXSentiment ingestXSentiment --opportunityId <id>
npx convex run actions/ingestXSentiment ingestXSentimentBatch --limit 5
```

### Project Structure

```
pika-edge/
├── app/                    # Next.js app router
│   ├── map/               # Main map explorer
│   ├── (auth)/            # Authentication pages
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── map/               # Map-specific components
│   ├── feed/              # Real-time feed components
│   └── auth/              # Authentication components
├── convex/                # Backend (Convex)
│   ├── schema.ts          # Database schema
│   ├── cities.ts          # City queries
│   ├── opportunities.ts   # Opportunity data
│   └── feed.ts            # Real-time feed
├── lib/
│   ├── hooks/             # Custom React hooks
│   ├── constants/         # Static data
│   └── utils/             # Utility functions
└── spec/                  # Product specifications
    └── pika-edge.md       # Full PRD
```

---

## 🗺️ Covered Regions

### Malaysia (MY)
- Kuala Lumpur
- Penang
- Johor Bahru
- Ipoh
- Kota Kinabalu

### Singapore (SG)
- Singapore

### Japan (JP)
- Tokyo
- Osaka
- Nagoya
- Fukuoka
- Sapporo
- Kyoto

---

## 📊 Product Categories

- 💻 Electronics
- 👟 Sneakers
- 👕 Fashion
- 🏆 Collectibles
- 🎮 Gaming
- ⌚ Watches
- 👜 Bags
- ✨ Cosmetics

---

## 🔐 Authentication (Optional)

Authentication is **optional** in V1. The app works fully without signing in.

**Anonymous users** get:
- Full map access
- Real-time feed
- All filtering capabilities
- Opportunity details

**Authenticated users** get everything above plus:
- Bookmark favorite cities
- Synced preferences across devices
- Early access to new features

To enable authentication, set up Clerk:

1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable and secret keys to `.env.local`
4. Create a JWT template named "convex"
5. Restart the dev server

See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md#authentication-strategy) for detailed setup.

---

## 📈 Success Metrics (V1 Goals)

| Metric | Target |
|--------|--------|
| Monthly Active Users | 1,000+ |
| Daily Tile Views | 1,500+ |
| Newsletter Conversion | ≥ 10% |
| Map Load Time (p95) | < 1.5s |
| System Uptime | > 99% |

---

## 📖 Documentation

- **[Product Requirements Document](./spec/pika-edge.md)** - Full PRD with user stories and narratives
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Detailed technical implementation guide
- **[Convex Documentation](https://docs.convex.dev)** - Backend platform docs
- **[shadcn/ui Documentation](https://ui.shadcn.com)** - UI component library

---

## 🚢 Deployment

### Convex Backend
```bash
# Deploy functions and schema
npx convex deploy

# Set environment variables in Convex dashboard
# Go to Settings → Environment Variables
```

### Next.js Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

**Environment Variables for Production:**
Make sure to set in Vercel dashboard:
- `NEXT_PUBLIC_CONVEX_URL` (from Convex production deployment)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (if using auth)
- `CLERK_SECRET_KEY` (if using auth)

---

## 🤝 Contributing

This project is currently in active development for V1 release.

### Development Workflow
1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly (map interactions, feed updates, mobile responsiveness)
4. Create a pull request

### Code Standards
- Follow existing code patterns
- Keep files under 300 lines
- Write clear, descriptive commit messages
- Test on both desktop and mobile
- Ensure accessibility (keyboard navigation, screen readers)

---

## 📝 Roadmap

### V1 (Current - 4 weeks)
- ✅ Interactive map with city tiles
- ✅ Real-time global feed
- ✅ Geographic and category filtering
- ✅ Mobile responsive design
- ✅ Onboarding tour
- ✅ Optional authentication
- ✅ Newsletter opt-in

### V2 (Future)
- 🔮 Premium map layers
- 🔮 Advanced analytics dashboard
- 🔮 Profitability calculators
- 🔮 Price alerts and notifications
- 🔮 Multi-language support
- 🔮 Additional countries (TH, VN, ID)

---

## 🐛 Known Issues

Track issues and feature requests in the GitHub Issues tab.

---

## 📄 License

[License information to be added]

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org) by Vercel
- Backend powered by [Convex](https://convex.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Maps by [shadcn-map](https://shadcn-map.vercel.app) (Leaflet + React)
- Authentication by [Clerk](https://clerk.com)

---

## 📧 Contact

For questions, feedback, or partnership inquiries:
- Create an issue in this repository
- [Contact information to be added]

---

**Built for arbitrage enthusiasts who move fast on market opportunities** 🚀
