"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type MapUpdaterProps = {
  center: [number, number];
};

function MapUpdater({ center }: MapUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

interface MapComponentProps {
  lat: number;
  lng: number;
  radius: number;
  interactive?: boolean;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
}

function MapClickHandler({
  enabled,
  onLocationSelect,
}: {
  enabled: boolean;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled || !onLocationSelect) return;
      onLocationSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function MapComponent({
  lat,
  lng,
  radius,
  interactive = false,
  onLocationSelect,
}: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const center: [number, number] = [lat, lng];
  const radiusLabel = useMemo(
    () => `${radius}m (${(radius / 1000).toFixed(2)}km)`,
    [radius],
  );

  useEffect(() => {
    Promise.resolve().then(() => setIsMounted(true));
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-xl border-2 border-border bg-muted">
        <p className="text-xs text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl border-2 border-border shadow-lg">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          maxZoom={20}
        />

        <Marker position={center} icon={redIcon} />
        <MapClickHandler enabled={interactive} onLocationSelect={onLocationSelect} />
        <Circle
          center={center}
          radius={Math.max(1, radius)}
          pathOptions={{
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
            color: "#3b82f6",
            opacity: 0.7,
            weight: 2,
          }}
        />
        <MapUpdater center={center} />
      </MapContainer>

      <div className="absolute top-3 left-3 z-10 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Center Point
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-medium text-gray-600 dark:text-gray-400">
                Lat:
              </span>
              <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                {lat.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-medium text-gray-600 dark:text-gray-400">
                Lng:
              </span>
              <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                {lng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-20 rounded-xl border border-blue-400 bg-blue-500/95 px-4 py-2.5 shadow-xl backdrop-blur dark:border-blue-500 dark:bg-blue-600/95">
        <div className="flex items-center gap-2.5 text-white">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          <div>
            <p className="text-xs font-semibold">Voting Radius</p>
            <p className="text-sm font-bold">
              {radiusLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-10 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <p className="mb-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
          Satellite View
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Zoom and pan enabled
        </p>
      </div>
    </div>
  );
}
