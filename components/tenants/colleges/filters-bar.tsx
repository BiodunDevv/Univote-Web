"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CollegeStatusFilter } from "./types";

type FiltersBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: CollegeStatusFilter;
  onStatusChange: (value: CollegeStatusFilter) => void;
  filteredCount?: number;
};

export function FiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  filteredCount,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search colleges..."
          className="h-9 pl-8 pr-8 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => onStatusChange("all")}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "active" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => onStatusChange("active")}
        >
          Active
        </Button>
        <Button
          variant={statusFilter === "inactive" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => onStatusChange("inactive")}
        >
          Inactive
        </Button>
        {typeof filteredCount === "number" && (
          <span className="ml-1 text-xs text-muted-foreground">
            {filteredCount} result{filteredCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
