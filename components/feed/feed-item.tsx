"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Doc } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Bell, ImageOff, MapPin, Sparkles, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const typeIcons = {
  new_opportunity: Sparkles,
  price_drop: TrendingUp,
  hot_deal: AlertTriangle,
  market_alert: Bell,
};

const typeStyles: Record<
  Doc<"feedItems">["type"],
  { bg: string; text: string }
> = {
  new_opportunity: { bg: "bg-green-100", text: "text-green-800" },
  price_drop: { bg: "bg-blue-100", text: "text-blue-800" },
  hot_deal: { bg: "bg-red-100", text: "text-red-800" },
  market_alert: { bg: "bg-yellow-100", text: "text-yellow-800" },
};

interface FeedItemProps {
  item: Doc<"feedItems">;
  onJumpToMap?: (cityId: string) => void;
}

export function FeedItem({ item, onJumpToMap }: FeedItemProps) {
  const Icon = typeIcons[item.type];
  const styles = typeStyles[item.type];
  const [imageError, setImageError] = useState(false);

  const handleMapClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onJumpToMap?.(item.cityId);
  };

  return (
    <Link href={`/item/${item._id}`} className="block">
      <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden w-full">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Image thumbnail */}
          <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
            {item.imageUrl && !imageError ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="64px"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            {/* Type badge overlay */}
            <div className={`absolute bottom-0 right-0 p-1 rounded-tl-md ${styles.bg} ${styles.text}`}>
              <Icon className="h-3 w-3" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold text-sm truncate flex-1 min-w-0">{item.title}</p>
              {onJumpToMap && (
                <button
                  onClick={handleMapClick}
                  className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                  title={`View ${item.cityName} on map`}
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {item.category}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {item.cityName}, {item.country}
              </span>
            </div>
            {item.priceInfo && (
              <p className="text-sm font-medium text-primary mt-1">
                {item.priceInfo}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
