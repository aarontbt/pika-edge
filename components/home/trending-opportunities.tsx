"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Opportunity = Doc<"opportunities"> & { cityId: Id<"cities"> };

export function TrendingOpportunities() {
  const [ingesting, setIngesting] = useState(false);
  const [ingestionAttempted, setIngestionAttempted] = useState(false);
  const opportunities = useQuery(api.opportunities.listRecent, { limit: 6 });
  // @ts-expect-error dataIngestion is newly added and will be present once Convex codegen updates
  const runDataIngestion = useAction(api.actions.dataIngestion.dataIngestion);

  const hasData = (opportunities?.length ?? 0) > 0;

  // Pull live data automatically the first time we see an empty dataset
  useEffect(() => {
    if (ingestionAttempted) return;
    if (opportunities === undefined) return;
    if (hasData) return;

    setIngestionAttempted(true);
    setIngesting(true);
    runDataIngestion({})
      .catch((error: unknown) => {
        console.error("Failed to ingest live opportunities", error);
        // allow manual retry via button
        setIngestionAttempted(false);
      })
      .finally(() => setIngesting(false));
  }, [hasData, ingestionAttempted, opportunities, runDataIngestion]);

  const handleRefresh = async () => {
    setIngestionAttempted(true);
    setIngesting(true);
    try {
      await runDataIngestion({});
    } catch (error) {
      console.error("Failed to refresh live opportunities", error);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Trending Opportunities
            </h2>
            <p className="text-muted-foreground mt-2">
              Latest deals spotted across the region (live data)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={ingesting}
            >
              {ingesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching live data...
                </>
              ) : (
                <>
                  Refresh live data
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <Link href="/map">
              <Button variant="outline" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {opportunities === undefined || ingesting ? (
          <TrendingSkeleton />
        ) : hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.slice(0, 6).map((opp, idx) => (
              <OpportunityCard key={opp._id} opportunity={opp} isHot={idx === 0} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p className="font-medium">No live opportunities yet.</p>
            <p className="text-sm mt-1">Try refreshing to fetch the latest data.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function OpportunityCard({
  opportunity,
  isHot,
}: {
  opportunity: Opportunity;
  isHot: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  const formattedPrice = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: opportunity.priceCurrency,
        maximumFractionDigits: 2,
      }).format(opportunity.priceLocal);
    } catch {
      return `${opportunity.priceCurrency} ${opportunity.priceLocal.toFixed(2)}`;
    }
  }, [opportunity.priceCurrency, opportunity.priceLocal]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow p-0 h-full flex flex-col">
      <div className="bg-gradient-to-br from-[#f5f7f9] to-[#e5e7eb] dark:from-secondary dark:to-secondary/50 h-48 flex items-center justify-center relative">
        {isHot && (
          <Badge className="absolute top-4 right-4" variant="default">
            HOT
          </Badge>
        )}
        {opportunity.imageUrl && !imageError ? (
          <Image
            src={opportunity.imageUrl}
            alt={opportunity.title}
            fill
            className="object-cover"
            sizes="100vw"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="text-6xl">🎴</div>
        )}
      </div>
      <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-bold line-clamp-1">{opportunity.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {opportunity.description || "Fresh opportunity just added"}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-[#163300] dark:text-[#9FE870]">
              {formattedPrice}
            </div>
            {opportunity.priceSpread !== undefined && (
              <div className="text-xs text-muted-foreground">
                +{opportunity.priceSpread.toFixed(1)}% potential spread
              </div>
            )}
            {opportunity.referenceCity && (
              <div className="text-[11px] text-muted-foreground">
                Reference: {opportunity.referenceCity}
              </div>
            )}
          </div>
          <Badge variant="secondary">{opportunity.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((key) => (
        <Card key={key} className="p-0 overflow-hidden">
          <div className="h-48 bg-muted animate-pulse" />
          <CardContent className="p-6 space-y-4">
            <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              <div className="h-5 w-12 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
