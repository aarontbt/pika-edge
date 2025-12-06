"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Doc } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Bell, Sparkles, TrendingUp } from "lucide-react";

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

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden w-full"
      onClick={() => onJumpToMap?.(item.cityId)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full shrink-0 ${styles.bg} ${styles.text}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold text-sm truncate flex-1 min-w-0">{item.title}</p>
              <Badge variant="secondary" className="text-xs shrink-0 truncate max-w-[80px]">
                {item.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.cityName}, {item.country}
            </p>
            {item.priceInfo && (
              <p className="text-sm text-muted-foreground mt-1">
                {item.priceInfo}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
