import { useState } from "react";
import dynamic from "next/dynamic";
import { CalendarIcon, Clock3, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SessionCreationFormData } from "@/components/tenants/sessions/create/types";
import {
  formatDateButtonLabel,
  formatTimeValue,
  mergeDateAndTime,
  parseDateValue,
} from "@/components/tenants/sessions/session-form-utils";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] w-full items-center justify-center rounded-xl border-2 border-border bg-muted">
      <div className="text-center">
        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

type ScheduleLocationStepProps = {
  formData: SessionCreationFormData;
  onDateTimeChange: (field: "start_time" | "end_time", value: string) => void;
  onLocationChange: (
    field: "lat" | "lng" | "radius_meters",
    value: number,
  ) => void;
};

type SearchResult = {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
};

function DateTimeField({
  id,
  label,
  description,
  value,
  onChange,
}: {
  id: "start_time" | "end_time";
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseDateValue(value);

  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="space-y-1">
        <Label htmlFor={`${id}-time`} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_136px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="justify-start gap-2 text-left font-normal"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateButtonLabel(value, "Pick a date")}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) =>
                onChange(mergeDateAndTime(value, date, formatTimeValue(value)))
              }
            />
          </PopoverContent>
        </Popover>

        <InputGroup className="h-9">
          <InputGroupAddon align="inline-start">
            <Clock3 className="h-3.5 w-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${id}-time`}
            type="time"
            value={formatTimeValue(value)}
            onChange={(event) =>
              onChange(
                mergeDateAndTime(
                  value,
                  selectedDate || new Date(),
                  event.target.value,
                ),
              )
            }
            className="text-sm"
          />
        </InputGroup>
      </div>
    </div>
  );
}

export function ScheduleLocationStep({
  formData,
  onDateTimeChange,
  onLocationChange,
}: ScheduleLocationStepProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    setSearchError("");
    setResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query.trim())}`,
      );
      const nextResults = (await response.json()) as SearchResult[];

      if (!Array.isArray(nextResults) || nextResults.length === 0) {
        throw new Error("No matching place was found.");
      }

      setResults(nextResults);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Location search failed.",
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            Session Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          <DateTimeField
            id="start_time"
            label="Start date and time"
            description="Choose when this voting window opens."
            value={formData.start_time}
            onChange={(value) => onDateTimeChange("start_time", value)}
          />
          <DateTimeField
            id="end_time"
            label="End date and time"
            description="Choose when voting closes and results lock."
            value={formData.end_time}
            onChange={(value) => onDateTimeChange("end_time", value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Geofence Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-2 text-xs text-muted-foreground">
              Set where voters must be physically present to vote in this
              session.
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Latitude
                </Label>
                <InputGroup className="h-9">
                  <InputGroupAddon align="inline-start">
                    <MapPin className="h-3.5 w-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    step="any"
                    value={formData.location.lat}
                    onChange={(event) =>
                      onLocationChange("lat", Number(event.target.value) || 0)
                    }
                    className="text-sm"
                  />
                </InputGroup>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Longitude
                </Label>
                <InputGroup className="h-9">
                  <InputGroupAddon align="inline-start">
                    <MapPin className="h-3.5 w-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    step="any"
                    value={formData.location.lng}
                    onChange={(event) =>
                      onLocationChange("lng", Number(event.target.value) || 0)
                    }
                    className="text-sm"
                  />
                </InputGroup>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-3">
              <Label className="text-xs font-medium text-muted-foreground">
                Radius (meters)
              </Label>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    onLocationChange(
                      "radius_meters",
                      Math.max(500, formData.location.radius_meters - 500),
                    )
                  }
                >
                  -
                </Button>
                <InputGroup className="h-9">
                  <InputGroupInput
                    type="number"
                    value={formData.location.radius_meters}
                    onChange={(event) =>
                      onLocationChange(
                        "radius_meters",
                        Math.max(100, Number(event.target.value) || 500),
                      )
                    }
                    className="text-center text-sm"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>m</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    onLocationChange(
                      "radius_meters",
                      formData.location.radius_meters + 500,
                    )
                  }
                >
                  +
                </Button>
              </div>
              <Input
                type="range"
                min={100}
                max={10000}
                step={100}
                value={formData.location.radius_meters}
                onChange={(event) =>
                  onLocationChange(
                    "radius_meters",
                    Number(event.target.value) || 500,
                  )
                }
                className="mt-3"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Coverage radius:{" "}
                {(formData.location.radius_meters / 1000).toFixed(2)} km
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Map Preview</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Search for a place or tap on the map to move the geofence center.
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <div className="flex gap-2">
                <InputGroup className="h-9 flex-1">
                  <InputGroupAddon align="inline-start">
                    <Search className="h-3.5 w-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search and pick a location"
                    className="text-sm"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleSearch();
                      }
                    }}
                  />
                </InputGroup>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSearch()}
                  disabled={searching || !query.trim()}
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
              {searchError ? (
                <p className="mt-1 text-[11px] text-destructive">{searchError}</p>
              ) : null}
              {results.length > 0 ? (
                <div className="absolute right-0 z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border bg-background shadow-xl z-50">
                  {results.map((result) => (
                    <button
                      key={`${result.lat}-${result.lon}-${result.display_name}`}
                      type="button"
                      className="flex w-full flex-col gap-1 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
                      onClick={() => {
                        onLocationChange("lat", Number(result.lat));
                        onLocationChange("lng", Number(result.lon));
                        setQuery(result.display_name);
                        setResults([]);
                      }}
                    >
                      <span className="line-clamp-1 text-xs font-medium text-foreground">
                        {result.name || result.display_name.split(",")[0]}
                      </span>
                      <span className="line-clamp-2 text-[11px] text-muted-foreground">
                        {result.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <MapComponent
              lat={formData.location.lat}
              lng={formData.location.lng}
              radius={formData.location.radius_meters}
              interactive
              onLocationSelect={({ lat, lng }) => {
                onLocationChange("lat", lat);
                onLocationChange("lng", lng);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
