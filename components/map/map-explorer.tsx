"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import map components to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const CityTile = dynamic(() => import("./city-tile").then((mod) => mod.CityTile), {
  ssr: false,
});

const MapLegend = dynamic(
  () => import("./map-legend").then((mod) => mod.MapLegend),
  { ssr: false }
);

// Center point between MY/SG/JP
const MAP_CENTER: [number, number] = [15.0, 115.0];
const DEFAULT_ZOOM = 4;

function MapSkeleton() {
  return (
    <div className="relative h-full w-full">
      <Skeleton className="h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    </div>
  );
}

interface MapExplorerProps {
  countryFilter?: string | null;
}

export function MapExplorer({ countryFilter }: MapExplorerProps) {
  const cities = useQuery(api.cities.list);
  const filteredCities = useMemo(() => {
    if (!cities) return [];
    return countryFilter
      ? cities.filter((city) => city.country === countryFilter)
      : cities;
  }, [cities, countryFilter]);

  if (cities === undefined) {
    return <MapSkeleton />;
  }

  const showEmptyState = filteredCities.length === 0;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={MAP_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
        minZoom={3}
        maxZoom={12}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {filteredCities.map((city) => (
          <CityTile key={city._id} city={city} />
        ))}
      </MapContainer>
      <MapLegend />
      {showEmptyState && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur px-4 py-3 rounded-lg shadow-md text-sm text-muted-foreground">
            No cities match the selected filters yet.
          </div>
        </div>
      )}
    </div>
  );
}
