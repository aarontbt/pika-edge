"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Map,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Globe,
  Zap,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrendingOpportunities } from "@/components/home/trending-opportunities";
import { Id } from "@/convex/_generated/dataModel";

export const dynamic = "force-dynamic";

type City = {
  _id: Id<"cities">;
  name: string;
  countryName?: string;
  country?: string;
  activityLevel: "hot" | "warm" | "normal" | "cold";
  opportunityCount?: number;
};

type FeedItem = {
  _id: Id<"feedItems">;
  title: string;
  type: "new_opportunity" | "price_drop" | "hot_deal" | "market_alert";
  cityName: string;
  country: string;
  category: string;
  priceInfo?: string;
  createdAt: number;
};

export default function Home() {
  const cities = useQuery(api.cities.list) as City[] | undefined;
  const recentFeed = useQuery(api.feed.list, { limit: 6 }) as FeedItem[] | undefined;

  const hotCities = cities
    ?.filter((c) => c.activityLevel === "hot")
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
      <div className="bg-[#E8F9DD] py-2.5 text-center">
        <p className="text-sm text-[#163300] flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>New: Real-time arbitrage alerts for 12+ cities.</span>
          <Link href="/map" className="font-semibold underline underline-offset-2 hover:no-underline">
            Start exploring
          </Link>
        </p>
      </div>

      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#9FE870] rounded-lg flex items-center justify-center">
                <span className="text-[#163300] font-bold text-sm">PE</span>
              </div>
              <span className="font-bold text-xl tracking-tight">PikaEdge</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/map">
                <Button variant="ghost" className="rounded-full">
                  Map Explorer
                </Button>
              </Link>
              <Button variant="ghost" className="rounded-full">
                Categories
              </Button>
              <Button variant="ghost" className="rounded-full">
                Pricing
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden md:inline-flex">
              Log in
            </Button>
            <Link href="/map">
              <Button>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Wise Style */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]">
              WHERE CARDS
              <br />
              MEET{" "}
              <span className="text-[#9FE870]">OPPORTUNITY</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {cities?.length || 12} cities. 3 countries. Find trading card opportunities
              that save you money across Asia Pacific.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/map">
                <Button size="xl" className="gap-2 w-full sm:w-auto">
                  <Map className="h-5 w-5" />
                  Explore the Map
                </Button>
              </Link>
              <Button size="xl" variant="outline" className="gap-2 w-full sm:w-auto">
                <TrendingUp className="h-5 w-5" />
                View Hot Deals
              </Button>
            </div>
          </div>

          {/* Currency/Country Cards - Wise Style */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { country: "Malaysia", flag: "🇲🇾", currency: "MYR", cities: 4 },
              { country: "Singapore", flag: "🇸🇬", currency: "SGD", cities: 3 },
              { country: "Japan", flag: "🇯🇵", currency: "JPY", cities: 5 },
            ].map((item) => (
              <Card key={item.country} className="p-6 hover:shadow-lg cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{item.flag}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{item.cities} Cities</p>
                  <p className="text-muted-foreground">{item.country} · {item.currency}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#f5f7f9] dark:bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Why traders choose PikaEdge
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real-time data and smart tools to find the best arbitrage opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Globe,
                title: "Multi-Region Coverage",
                description: "Track opportunities across Malaysia, Singapore, and Japan in real-time.",
              },
              {
                icon: Zap,
                title: "Real-Time Updates",
                description: "Get instant alerts when new deals drop or prices change significantly.",
              },
              {
                icon: Shield,
                title: "Verified Sources",
                description: "We verify all listings from trusted retailers and marketplaces.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-8 text-center border-0 shadow-none bg-transparent">
                <div className="w-16 h-16 bg-[#E8F9DD] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-8 w-8 text-[#163300]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <TrendingOpportunities />

      {/* Categories Section */}
      <section className="py-20 bg-[#f5f7f9] dark:bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Popular Categories
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Pokémon TCG", emoji: "⚡" },
              { name: "Yu-Gi-Oh!", emoji: "🌟" },
              { name: "Sports Cards", emoji: "🏀" },
              { name: "One Piece", emoji: "☠️" },
              { name: "Magic: The Gathering", emoji: "🔮" },
              { name: "Dragon Ball", emoji: "🐉" },
              { name: "Digimon", emoji: "🦖" },
              { name: "Collectibles", emoji: "💎" },
            ].map((cat) => (
              <Link href="/map" key={cat.name}>
                <Card className="p-6 text-center hover:shadow-lg cursor-pointer group hover:border-[#9FE870] transition-all">
                  <div className="text-4xl mb-3">{cat.emoji}</div>
                  <p className="font-semibold text-sm">{cat.name}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Live Feed Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Live Activity
              </h2>
              <p className="text-muted-foreground mt-2">
                Real-time updates from across the region
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {recentFeed?.map((item) => (
              <Card key={item._id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#E8F9DD] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-lg">
                      {item.type === "new_opportunity" && "🆕"}
                      {item.type === "price_drop" && "📉"}
                      {item.type === "hot_deal" && "🔥"}
                      {item.type === "market_alert" && "⚠️"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">{item.title}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.cityName}, {item.country}
                      {item.priceInfo && ` · ${item.priceInfo}`}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Markets Section */}
      {hotCities && hotCities.length > 0 && (
        <section className="py-20 bg-[#f5f7f9] dark:bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                🔥 Hottest Markets Right Now
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {hotCities.map((city) => (
                <Link href="/map" key={city._id}>
                  <Card className="p-6 hover:shadow-lg cursor-pointer group hover:border-[#9FE870] transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">
                        {city.country === "MY" && "🇲🇾"}
                        {city.country === "SG" && "🇸🇬"}
                        {city.country === "JP" && "🇯🇵"}
                      </span>
                      <Badge>HOT</Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{city.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{city.countryName}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <span className="text-2xl font-bold">{city.opportunityCount}</span>
                        <span className="text-muted-foreground text-sm ml-2">Active Deals</span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-[#9FE870] transition-all" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto p-12 text-center border-2 border-[#9FE870] bg-[#E8F9DD]/30">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[#9FE870] rounded-2xl flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-[#163300]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Ready to find your next flip?
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Join traders discovering profitable arbitrage opportunities across Asia Pacific every day.
              </p>
              <Link href="/map">
                <Button size="xl" className="gap-2">
                  <Map className="h-5 w-5" />
                  Launch Map Explorer
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#9FE870] rounded-lg flex items-center justify-center">
                  <span className="text-[#163300] font-bold text-sm">PE</span>
                </div>
                <span className="font-bold text-lg">PikaEdge</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trading card arbitrage companion across Asia Pacific
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Regions</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>🇲🇾 Malaysia</li>
                <li>🇸🇬 Singapore</li>
                <li>🇯🇵 Japan</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Pokémon TCG</li>
                <li>Sports Cards</li>
                <li>Yu-Gi-Oh!</li>
                <li>Collectibles</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/map" className="hover:text-foreground transition-colors">
                    Map Explorer
                  </Link>
                </li>
                <li>Live Feed</li>
                <li>Hot Deals</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} PikaEdge. Built for trading card enthusiasts and arbitrage flippers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
