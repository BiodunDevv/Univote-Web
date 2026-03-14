import dynamic from "next/dynamic";
import { CalendarIcon, Clock3, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SessionCreationFormData } from "@/components/tenants/sessions/create/types";
import {
  formatDateButtonLabel,
  formatTimeValue,
  mergeDateAndTime,
  parseDateValue,
} from "@/components/tenants/sessions/session-form-utils";

import "leaflet/dist/leaflet.css";

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

        <div className="relative">
          <Clock3 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`${id}-time`}
            type="time"
            value={formatTimeValue(value)}
            onChange={(event) =>
              onChange(
                mergeDateAndTime(value, selectedDate || new Date(), event.target.value),
              )
            }
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}

export function ScheduleLocationStep({
  formData,
  onDateTimeChange,
  onLocationChange,
}: ScheduleLocationStepProps) {
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
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Latitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.location.lat}
                  onChange={(event) =>
                    onLocationChange("lat", Number(event.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Longitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.location.lng}
                  onChange={(event) =>
                    onLocationChange("lng", Number(event.target.value) || 0)
                  }
                />
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
                <Input
                  type="number"
                  value={formData.location.radius_meters}
                  onChange={(event) =>
                    onLocationChange(
                      "radius_meters",
                      Number(event.target.value) || 500,
                    )
                  }
                  className="text-center"
                />
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
              <p className="mt-2 text-xs text-muted-foreground">
                Coverage radius:{" "}
                {(formData.location.radius_meters / 1000).toFixed(2)} km
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Map Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <MapComponent
              lat={formData.location.lat}
              lng={formData.location.lng}
              radius={formData.location.radius_meters}
            />
            <p className="text-xs text-muted-foreground">
              The marker shows the session center, and the shaded region shows
              the valid voting radius for geofenced ballots.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
