"use client";

import { useState } from "react";
import { MapExplorer } from "@/components/map/map-explorer";
import { GlobalFeed } from "@/components/feed/global-feed";
import { FeedFiltersState } from "@/components/feed/feed-filters";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Menu, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function MapPage() {
  const [filters, setFilters] = useState<FeedFiltersState>({
    country: null,
    category: null,
  });
  const [feedOpen, setFeedOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Wise Style */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#9FE870] rounded-lg flex items-center justify-center">
                <span className="text-[#163300] font-bold text-sm">PE</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Map Explorer</h1>
                <p className="text-xs text-muted-foreground">
                  Malaysia • Singapore • Japan
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sheet open={feedOpen} onOpenChange={setFeedOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                  Live Feed
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 h-full overflow-hidden"
              >
                <GlobalFeed filters={filters} onFiltersChange={setFilters} />
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Map + Feed */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 relative min-h-0">
          <MapExplorer countryFilter={filters.country} />
        </div>
        <aside className="hidden lg:flex lg:flex-col w-[380px] border-l bg-background min-h-0 overflow-hidden">
          <GlobalFeed filters={filters} onFiltersChange={setFilters} />
        </aside>
      </main>
    </div>
  );
}
