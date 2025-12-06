"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Wise-inspired color scheme
const legendItems = [
  { level: "hot", label: "Hot", color: "bg-[#9FE870]", description: "20+ deals" },
  { level: "warm", label: "Warm", color: "bg-[#C9F29B]", description: "10-19 deals" },
  { level: "normal", label: "Normal", color: "bg-[#1a1a1a]", description: "5-9 deals" },
  { level: "cold", label: "Cold", color: "bg-gray-400", description: "< 5 deals" },
];

export function MapLegend() {
  return (
    <Card className="absolute bottom-4 left-4 z-[1000] w-52 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-border/60">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-bold tracking-tight">Activity Level</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2.5">
          {legendItems.map((item) => (
            <div key={item.level} className="flex items-center gap-3">
              <div className={`h-3.5 w-3.5 rounded-full ${item.color} ring-2 ring-white shadow-sm`} />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs font-semibold">{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
