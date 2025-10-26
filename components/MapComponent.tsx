"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with Leaflet in Next.js
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

// Custom red marker icon
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

interface MapUpdaterProps {
  center: [number, number];
}

// Component to update map view when center changes
function MapUpdater({ center }: MapUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

interface MapComponentProps {
  lat: number;
  lng: number;
  radius: number;
}

export default function MapComponent({ lat, lng, radius }: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const center: [number, number] = [lat, lng];

  useEffect(() => {
    // Use a microtask to avoid synchronous setState warning
    Promise.resolve().then(() => setIsMounted(true));
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[500px] rounded-xl border-2 border-border bg-muted flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border-2 border-border shadow-lg">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        {/* Satellite/Street view tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          maxZoom={20}
        />

        {/* Red marker for center */}
        <Marker position={center} icon={redIcon} />

        {/* Blue circle for radius */}
        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
            color: "#3b82f6",
            opacity: 0.6,
            weight: 2,
          }}
        />

        {/* Map updater */}
        <MapUpdater center={center} />
      </MapContainer>

      {/* Location Info Card - Facebook Style */}
      <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 px-4 py-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-1000">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Center Point
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium w-12">
                Lat:
              </span>
              <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                {lat.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium w-12">
                Lng:
              </span>
              <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                {lng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Radius Info Card - Facebook Style */}
      <div className="absolute bottom-3 left-3 bg-blue-500 dark:bg-blue-600 backdrop-blur-md bg-opacity-95 px-4 py-2.5 rounded-xl shadow-xl border border-blue-400 dark:border-blue-500 z-1000">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <div className="text-white">
            <p className="text-xs font-semibold">Voting Radius</p>
            <p className="text-sm font-bold">
              {radius}m
              <span className="text-xs font-normal ml-1 opacity-90">
                ({(radius / 1000).toFixed(2)}km)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Map Controls Card - Facebook Style */}
      <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 px-3 py-2 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-1000">
        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          🛰️ Satellite View
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Zoom & Pan enabled
        </p>
      </div>
    </div>
  );
}
