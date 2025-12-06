"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, TrendingUp, ExternalLink } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/constants/categories";

export default function CityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cityId = params.cityId as Id<"cities">;

  const city = useQuery(api.cities.getById, { cityId });
  const opportunities = useQuery(api.opportunities.listByCity, { cityId });

  if (city === undefined || opportunities === undefined) {
    return <CityDetailSkeleton />;
  }

  if (city === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>City Not Found</CardTitle>
            <CardDescription>
              The city you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/map")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Map
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryEmoji = (categoryId: string) => {
    const category = PRODUCT_CATEGORIES.find((c) => c.id === categoryId);
    return category?.emoji || "📦";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/map")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">{city.name}</h1>
                <p className="text-xs text-muted-foreground">{city.countryName}</p>
              </div>
            </div>
            <Badge
              variant={city.activityLevel === "hot" ? "destructive" : "secondary"}
              className="ml-auto"
            >
              {city.activityLevel}
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{city.opportunityCount}</div>
              <p className="text-sm text-muted-foreground">Active Opportunities</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{opportunities.length}</div>
              <p className="text-sm text-muted-foreground">Shown</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold capitalize">{city.activityLevel}</div>
              <p className="text-sm text-muted-foreground">Activity Level</p>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities */}
        <h2 className="text-xl font-semibold mb-4">Opportunities in {city.name}</h2>
        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No active opportunities in this city yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opportunity) => (
              <Card key={opportunity._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getCategoryEmoji(opportunity.category)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {opportunity.category}
                      </Badge>
                    </div>
                    {opportunity.priceSpread && (
                      <Badge
                        variant={opportunity.priceSpread > 20 ? "destructive" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        <TrendingUp className="h-3 w-3" />
                        {opportunity.priceSpread}%
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-2">{opportunity.title}</CardTitle>
                  {opportunity.description && (
                    <CardDescription className="line-clamp-2">
                      {opportunity.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">
                        {opportunity.priceCurrency}{" "}
                        {opportunity.priceLocal.toLocaleString()}
                      </p>
                      {opportunity.referenceCity && (
                        <p className="text-xs text-muted-foreground">
                          vs {opportunity.referenceCity}
                        </p>
                      )}
                    </div>
                    {opportunity.sourceUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={opportunity.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CityDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </main>
    </div>
  );
}
