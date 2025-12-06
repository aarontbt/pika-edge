"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/lib/constants/categories";

export type FeedFiltersState = {
  country: string | null;
  category: string | null;
};

const COUNTRY_OPTIONS = [
  { id: "MY", label: "Malaysia" },
  { id: "SG", label: "Singapore" },
  { id: "JP", label: "Japan" },
];

interface FeedFiltersProps {
  filters: FeedFiltersState;
  onFiltersChange: (filters: FeedFiltersState) => void;
}

export function FeedFilters({ filters, onFiltersChange }: FeedFiltersProps) {
  const categoryOptions = useMemo(
    () => PRODUCT_CATEGORIES.map((cat) => ({ id: cat.id, label: cat.label })),
    []
  );

  const handleCountryChange = (value: string | undefined) => {
    if (!value || value === "reset") {
      onFiltersChange({ ...filters, country: null });
      return;
    }
    onFiltersChange({
      ...filters,
      country: value,
    });
  };

  const handleCategoryChange = (value: string | undefined) => {
    if (!value || value === "reset") {
      onFiltersChange({ ...filters, category: null });
      return;
    }
    onFiltersChange({
      ...filters,
      category: value,
    });
  };

  const handleReset = () => {
    onFiltersChange({ country: null, category: null });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select value={filters.country ?? undefined} onValueChange={(val) => handleCountryChange(val)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reset">All Countries</SelectItem>
            {COUNTRY_OPTIONS.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.category ?? undefined} onValueChange={(val) => handleCategoryChange(val)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reset">All Categories</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
          Reset filters
        </Button>
      </div>
    </div>
  );
}
