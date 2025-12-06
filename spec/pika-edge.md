# PikaEdge Map Explorer V1 - PRD

### TL;DR

PikaEdge Map Explorer V1 offers arbitrage enthusiasts and data-driven sellers a fast, interactive map to visually track and discover trending items and price differences across major cities and metro areas in Malaysia, Singapore, and Japan. Targeting power flippers and arbitrageurs, its real-time, tile-based map and global feed enable seamless opportunity scouting by geography and network. This is a foundational release focusing on performance, coverage, and actionable insight delivery.

---

## Goals

### Business Goals

* Achieve 1,000+ unique MAUs within the first three months post-launch.

* Enable >1,500 daily map tile views with at least 15% returning user rate.

* Drive newsletter sign-ups or product demo requests with a conversion rate target of 10%.

* Validate demand for premium map layers and city expansion via tracked interest forms.

### User Goals

* Rapidly identify cities or metro areas with the most lucrative arbitrage or flipping opportunities.

* Filter and explore product deals by region, ensuring users stay ahead of market trends.

* Easily access a feed of the latest city-specific and cross-market activity to spot potential price spreads.

* Seamlessly navigate and personalize the map to visualize both macro and micro opportunities.

### Non-Goals

* In-depth analytics or profitability calculators (out of scope for V1).

* Transactional functionality (no purchasing or offer-placing within app).

* Support for countries or metros beyond MY/SG/JP for this version.

---

## User Stories

**Persona 1: Arbitrage Flipper ("Flipper")**

* As a Flipper, I want to view a map of trending products across MY/SG/JP cities, so that I can target metros with the best arbitrage potential.

* As a Flipper, I want to drill into a city tile for a list of hot opportunities, so that I can quickly decide where to act.

* As a Flipper, I want to see recent deals in a global feed, so that I can track market shifts and move fast on trends.

**Persona 2: Power Seller**

* As a Power Seller, I want to compare product activity by metro, so that I can optimize sourcing and inventory for specific cities.

* As a Power Seller, I want mobile-friendly map exploration, so that I can perform research while on the move.

**Persona 3: New User / Explorer**

* As a New User, I want a short onboarding tour, so that I understand how to leverage map tiles and the global feed.

* As a New User, I want a fast and visually clear overview of the platform, so that I don't feel lost on my first visit.

---

## Functional Requirements

* **Map Visualization (Priority: High)**

  * Map Rendering: Interactive map with tile-based navigation for MY, SG, JP.

  * City/Metro Tiles: Clickable or tappable tiles for each major metro, visually differentiated by opportunity density.

  * Zoom & Pan: Smooth navigation across the map, including zoom in/out to city or metro clusters.

* **Data Feeds (Priority: High)**

  * Global Feed: Chronological, real-time list of new deals or opportunities across all cities.

  * City Tile Details: Modal or side-panel showing opportunity breakdown per tile.

  * Data Refresh: Automatic refreshing of feed and map tiles at regular intervals.

* **Filtering & Discovery (Priority: Medium)**

  * Geographic Filters: Country and city filter toggles.

  * Product Category Filter: Ability to filter map and feed by product category (limited selection in V1).

* **User Interface & Onboarding (Priority: Medium)**

  * First-Time Tour: Guided onboarding highlighting map and feed features.

  * Mobile Responsiveness: UI/UX optimized for phone screens in addition to desktop.

* **Account & Engagement (Priority: Low)**

  * Newsletter/Demo Opt-in: Modal or CTA for users to sign up for more info, limited to email collection.

---

## User Experience

**Entry Point & First-Time User Experience**

* Users access Map Explorer via direct homepage link, embedded splash in PikaEdge dashboard, or SEO landing pages.

* First-time users are greeted with a brief, optional onboarding overlay—explaining map navigation, metro tiles, and global feed.

* Tour can be dismissed and is never shown again for logged-in/returning users.

**Core Experience**

* **Step 1:** Landing on the Map

  * Clean, uncluttered map with prominent clickable tiles for MY, SG, and JP metros.

  * Legend and color coding to indicate deal/activity density.

  * Geo-center based on user IP, but easily panned elsewhere.

* **Step 2:** Interacting with Tiles

  * Users click/tap a metro tile: city-level stats and sample deals surface in a right-side panel or modal.

  * Drilldown includes brief descriptions, last update timestamp, and a CTA to view more details.

* **Step 3:** Global Feed Exploration

  * Persistent or slide-in panel at the bottom/right displays a live scrollable feed of new arbitrage/opportunity activity across regions.

  * Feed entries contain location, product, price-point, time, and jump-to-map-tile capability.

* **Step 4:** Filtering & Navigation

  * Toggle filters by geography or category to reshape map overlays and restrict feed entries.

  * Search bar for quick jump to cities.

* **Step 5:** Engagement & Opt-In

  * Floating CTA or modal encourages users to sign up for newsletter/demos after 2+ key actions or on exit intent.

**Advanced Features & Edge Cases**

* Power users can bookmark specific city tiles (if login enabled—optional for V1).

* Graceful loading state with shimmer for poor connectivity or initial loads.

* Fallback message and data stubs if a metro region has no current opportunities.

* Accessibility: Keyboard navigation, high-contrast map mode.

**UI/UX Highlights**

* Clean color palette optimized for accessibility.

* Responsive design for seamless desktop and mobile experience.

* Prominent, fast map interactions (avoid animation lag).

* All actionable areas have meaningful hovers or tap feedback.

* Summary indicators for density, update recency, and type of opportunity.

---

## Narrative

Jason, a seasoned arbitrage flipper in Singapore, starts his day by checking for new cross-border deals. In the past, he’s had to manually scrape online marketplaces and maintain endless spreadsheets to track city-level opportunities, causing friction and missed chances. He logs into PikaEdge Map Explorer and, within seconds, is greeted by a vibrant map of the region. The Kuala Lumpur tile is glowing with activity—Jason zooms in, discovering an influx of undervalued electronics compared to Tokyo prices. The map’s integrated global feed shows fresh alerts from Osaka, with sneaker drops creating a fever in the resale market.

With a few clicks, Jason filters by “Electronics” and sees not only city-specific deals but also direct price spread indicators between Singapore and Kuala Lumpur. The platform’s smooth loading and real-time feed allow him to quickly shortlist high potential products, plan his next sourcing trip, and avoid the noise that plagues traditional tools. Later that afternoon, he signs up for early-release alerts and demo updates, excited to see what future map layers will bring. Jason’s routine is now efficient and data-driven—he’s first to market, flipping faster and smarter.

---

## Success Metrics

### User-Centric Metrics

* Achieve at least 1,000 unique MAU and >1,500 daily tile views within 3 months.

* 

> 15% of sessions involving 2+ city tile interactions.

* Opt-in conversion rate for newsletter/demo: ≥10%.

### Business Metrics

* Track baseline for paid upgrade or expansion interest.

* Set baseline user acquisition CAC for targeted ad tests.

### Technical Metrics

* Map tile load times under 1.5 seconds (p95).

* System uptime >99% during first quarter.

* Data error rates below 1% of requests.

### Tracking Plan

* Map tile click/view events

* Feed item click-throughs

* Filter interaction logs

* Onboarding completion rates

* Newsletter/demo opt-in submissions

* Map load times/error logs

---

## Technical Considerations

### Technical Needs

* **Front-end Framework**: Responsive, performant interface using a modern JS framework.

* **Mapping Layer**: Dynamic rendering of city/metro tiles, supporting panning and zoom.

* **Real-time Data**: Distributed feed and tile metrics fetch; Push updates for feeds.

* **Back-end/Database**: Store city opportunity data, activity logs, user opt-ins.

* **Access Control**: Optional; most of V1 open-access, with gated opt-in features.

### Integration Points

* Opportunity data ingestion (internal + public sources/API feeds).

* Email provider integration for opt-in/notifications.

* Analytics tooling for event and error tracking.

### Data Storage & Privacy

* Store aggregate opportunity and activity data—no sensitive personal data required.

* Basic email storage for opt-in (hashed or secure DB).

* Adhere to GDPR/PDPA for JP/SG/MY user regions as relevant.

### Scalability & Performance

* Support hundreds of concurrent sessions, with short TTL caching for map data.

* Optimize for peak spikes (product drops/trending events).

* Asynchronous updates for feed to prevent UI lag.

### Potential Challenges

* Source data reliability and latency—fallback states for incomplete or delayed data.

* UI responsiveness on lower-end devices, especially for complex map interactions.

* Ensuring mobile map experience is as fast as desktop.

---

## Milestones & Sequencing

### Project Estimate

* **Medium:** 2–4 weeks for core product V1, including build, rounds of polish, and QA.

### Team Size & Composition

* **Small Team:** 2 people (1 Product/Design lead + 1 Engineer with full-stack capability).

### Suggested Phases

**Phase 1: Core Map Explorer MVP (1 week)**

* Key Deliverables: Engineer—map rendering, city tiles, feed integration; Product/Design—UI/UX, onboarding flow.

* Dependencies: Access to opportunity and activity data; map tile assets.

**Phase 2: Filtering, Feed & Responsiveness (1 week)**

* Key Deliverables: Engineer—filters, responsive nav, mobile views; Product/Design—filter UX, visual polish.

* Dependencies: Data categorization; responsiveness testing.

**Phase 3: Onboarding, Opt-ins, Performance Polish (1 week)**

* Key Deliverables: Product/Design—onboarding tutorial, opt-in forms; Engineer—analytics integration, loading optimization.

* Dependencies: Email provider setup; event logging pipeline.

**Phase 4: QA, Accessibility & Launch (up to 1 week)**

* Key Deliverables: Product/Design—accessibility review, bug fixing; Engineer—deployment, monitoring.

* Dependencies: Test devices, analytics dashboards.

---