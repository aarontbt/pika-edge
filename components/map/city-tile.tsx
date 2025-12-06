"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface CityTileProps {
  city: Doc<"cities">;
}

// Wise-inspired color scheme with lime green primary
const activityColors = {
  hot: "#9FE870",      // Wise lime green for hot
  warm: "#C9F29B",     // Lighter green for warm
  normal: "#1a1a1a",   // Dark for normal
  cold: "#9ca3af",     // Gray for cold
};

function createCustomIcon(city: Doc<"cities">) {
  const color = activityColors[city.activityLevel];
  const size = city.activityLevel === "hot" ? 44 : city.activityLevel === "warm" ? 40 : 36;
  const textColor = city.activityLevel === "hot" || city.activityLevel === "warm" ? "#163300" : "#ffffff";

  return L.divIcon({
    className: "custom-city-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${textColor};
        font-weight: 700;
        font-size: ${size > 40 ? "15px" : "13px"};
        box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      ">
        ${city.opportunityCount}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function CityTile({ city }: CityTileProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/map/${city._id}`);
  };

  return (
    <Marker
      position={[city.coordinates.lat, city.coordinates.lng]}
      icon={createCustomIcon(city)}
    >
      <Popup className="city-popup" minWidth={260} maxWidth={300}>
        <Card className="border-0 shadow-none -m-3">
          <CardHeader className="pb-3 pt-2 px-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg font-bold tracking-tight">{city.name}</CardTitle>
              <Badge
                variant={city.activityLevel === "hot" ? "default" : "secondary"}
                className={`text-xs uppercase tracking-wide ${
                  city.activityLevel === "warm"
                    ? "bg-[#E8F9DD] text-[#163300] border-[#9FE870]"
                    : ""
                }`}
              >
                {city.activityLevel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{city.countryName}</p>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex items-baseline gap-2 mb-4 pb-3 border-b">
              <span className="text-3xl font-black">{city.opportunityCount}</span>
              <span className="text-sm text-muted-foreground">
                active {city.opportunityCount === 1 ? "deal" : "deals"}
              </span>
            </div>
            <Button className="w-full" size="sm" onClick={handleViewDetails}>
              View Details
            </Button>
          </CardContent>
        </Card>
      </Popup>
    </Marker>
  );
}
