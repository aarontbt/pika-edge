"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  ExternalLink,
  ImageOff,
  MapPin,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SocialPosts } from "@/components/sentiment/social-posts";

const typeIcons = {
  new_opportunity: Sparkles,
  price_drop: TrendingUp,
  hot_deal: AlertTriangle,
  market_alert: Bell,
};

const typeStyles = {
  new_opportunity: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    label: "New Opportunity",
  },
  price_drop: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
    label: "Price Drop",
  },
  hot_deal: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    label: "Hot Deal",
  },
  market_alert: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    label: "Market Alert",
  },
};

function ItemDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-24 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex items-center justify-center">
            <Skeleton className="aspect-[3/4] w-full max-w-md rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const itemId = params.id as string;
  const item = useQuery(api.feed.getById, {
    id: itemId as Id<"feedItems">,
  });
  const sentiment = useQuery(
    api.sentiment.getSentimentByOpportunity,
    item?.opportunity
      ? { opportunityId: item.opportunity._id as Id<"opportunities"> }
      : "skip"
  );

  const handleShare = async () => {
    try {
      await navigator.share({
        title: item?.title,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (item === undefined) {
    return <ItemDetailSkeleton />;
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Item not found</h1>
          <p className="text-muted-foreground mb-6">
            This item may have been removed or expired.
          </p>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const typeKey = item.type as keyof typeof typeIcons;
  const Icon = typeIcons[typeKey];
  const styles = typeStyles[typeKey];
  const opportunity = item.opportunity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-8 lg:gap-12 items-start">
          {/* Left column - Info */}
          <div className="space-y-6">
            {/* Type badge */}
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${styles.bg} ${styles.text} shadow-sm`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {item.category}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              {item.title}
            </h1>

            {/* Description */}
            <div className="space-y-4 text-muted-foreground">
              {opportunity?.description && (
                <p className="text-lg leading-relaxed">
                  {opportunity.description}
                </p>
              )}
              <p className="text-sm">
                Spotted in <span className="font-medium text-foreground">{item.cityName}</span>,{" "}
                <span className="font-medium text-foreground">{item.city?.countryName || item.country}</span>
              </p>
            </div>

            {/* Location card */}
            <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.cityName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.city?.countryName || item.country}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Center column - Image */}
          <div className="flex items-center justify-center lg:px-4">
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900 shadow-2xl shadow-stone-300/50 dark:shadow-black/50">
              {item.imageUrl && !imageError ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={512}
                  height={720}
                  className="w-full h-auto object-contain"
                  onError={() => setImageError(true)}
                  unoptimized
                  priority
                />
              ) : (
                <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-4">
                  <ImageOff className="h-16 w-16 text-muted-foreground/30" />
                  <span className="text-muted-foreground/50 text-sm">
                    No image available
                  </span>
                </div>
              )}

              {/* Type indicator overlay */}
              <div
                className={`absolute top-4 left-4 px-3 py-1.5 rounded-full ${styles.bg} ${styles.text} text-sm font-medium backdrop-blur-sm`}
              >
                {styles.label}
              </div>
            </div>
          </div>

          {/* Right column - Price & Actions */}
          <div className="space-y-6">
            {/* Price info card */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
              {/* Price header */}
              {item.priceInfo && (
                <div className="mb-6">
                  <p className="text-3xl lg:text-4xl font-bold text-foreground">
                    {item.priceInfo}
                  </p>
                  {opportunity?.priceSpread && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {opportunity.priceSpread}% spread vs{" "}
                      {opportunity.referenceCity || "reference market"}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                {opportunity?.sourceUrl && (
                  <a
                    href={opportunity.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full h-12 text-base font-semibold gap-2 bg-foreground text-background hover:bg-foreground/90">
                      View listing
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}

                <Button
                  variant="outline"
                  className="w-full h-12 text-base gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Price breakdown */}
              {opportunity && (
                <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Local price</span>
                    <span className="font-medium">
                      {opportunity.priceCurrency}{" "}
                      {opportunity.priceLocal.toLocaleString()}
                    </span>
                  </div>
                  {opportunity.priceSpread && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Potential spread
                      </span>
                      <span className="font-medium text-primary">
                        +{opportunity.priceSpread}%
                      </span>
                    </div>
                  )}
                  {opportunity.referenceCity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-medium">
                        {opportunity.referenceCity}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Social sentiment */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">What people are saying</h2>
                <Badge variant="outline" className="text-xs">
                  X.com
                </Badge>
              </div>
              <SocialPosts
                posts={item?.opportunity ? sentiment?.posts : []}
                lastUpdated={item?.opportunity ? sentiment?.lastFetched : undefined}
                isLoading={Boolean(item?.opportunity) && sentiment === undefined}
              />
            </Card>

            {/* Metadata */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Posted{" "}
                {formatDistanceToNow(item.createdAt, { addSuffix: true })}
              </p>
              {opportunity?.status && (
                <p className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      opportunity.status === "active"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                  {opportunity.status === "active"
                    ? "Active listing"
                    : opportunity.status}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative container mx-auto px-4 py-8 mt-12 border-t border-border/50">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-foreground/80 hover:text-foreground transition-colors"
          >
            PikaEdge
          </Link>
          <p className="text-sm text-muted-foreground">
            Discover arbitrage opportunities
          </p>
        </div>
      </div>
    </div>
  );
}
