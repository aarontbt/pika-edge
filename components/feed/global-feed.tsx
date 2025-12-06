"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedFilters, FeedFiltersState } from "./feed-filters";
import { FeedItem } from "./feed-item";

interface GlobalFeedProps {
  filters?: FeedFiltersState;
  onFiltersChange?: (filters: FeedFiltersState) => void;
  limit?: number;
  onJumpToMap?: (cityId: string) => void;
}

export function GlobalFeed({
  filters: controlledFilters,
  onFiltersChange,
  limit = 50,
  onJumpToMap,
}: GlobalFeedProps) {
  const [internalFilters, setInternalFilters] = useState<FeedFiltersState>({
    country: null,
    category: null,
  });

  const filters = controlledFilters ?? internalFilters;
  const setFilters = onFiltersChange ?? setInternalFilters;

  const feedItems = useQuery(api.feed.list, {
    country: filters.country,
    category: filters.category,
    limit,
  });

  const headerLabel = useMemo(() => {
    if (filters.country && filters.category) {
      return `Live Activity · ${filters.country} · ${filters.category}`;
    }
    if (filters.country) return `Live Activity · ${filters.country}`;
    if (filters.category) return `Live Activity · ${filters.category}`;
    return "Live Activity";
  }, [filters.category, filters.country]);

  const hasItems = (feedItems?.length ?? 0) > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{headerLabel}</p>
            <p className="text-xs text-muted-foreground">
              Real-time feed across the region
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {feedItems?.length ?? 0} items
          </span>
        </div>
        <div className="mt-4">
          <FeedFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>

      <div className="flex-1">
        {feedItems === undefined ? (
          <FeedSkeleton />
        ) : hasItems ? (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {feedItems?.map((item) => (
                <FeedItem key={item._id} item={item} onJumpToMap={onJumpToMap} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground px-6 text-center">
            No activity yet for these filters.
          </div>
        )}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
