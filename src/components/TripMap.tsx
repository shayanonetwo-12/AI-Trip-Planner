import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Standard Leaflet Icon Fix for CDNs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: "morning" | "afternoon" | "evening" | "city";
  timeOfDay: string;
  description: string;
}

interface TripMapProps {
  centerLat: number;
  centerLng: number;
  markers: MapMarker[];
  activeDay: number;
}

export default function TripMap({ centerLat, centerLng, markers, activeDay }: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Helper to create beautiful modern HTML marker icons
  const getMarkerIcon = (type: MapMarker["type"], index: number) => {
    let colorClass = "bg-[#D4A373]";
    let iconLabel = "•";

    switch (type) {
      case "city":
        colorClass = "bg-[#C29262] animate-pulse";
        iconLabel = "📍";
        break;
      case "morning":
        colorClass = "bg-[#5A5A40]";
        iconLabel = "M";
        break;
      case "afternoon":
        colorClass = "bg-[#D4A373]";
        iconLabel = "A";
        break;
      case "evening":
        colorClass = "bg-[#7D7667]";
        iconLabel = "E";
        break;
    }

    return L.divIcon({
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full ${colorClass} text-white font-bold text-xs shadow-lg border-2 border-white hover:scale-115 transition-transform duration-200">
          ${iconLabel}
        </div>
      `,
      className: "custom-div-icon",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([centerLat, centerLng], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    } else {
      // If map exists, pan to the new center
      mapInstanceRef.current.setView([centerLat, centerLng], 12);
    }

    // Cleanup map instance on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [centerLat, centerLng]);

  // Update markers layer when markers or active day changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;

    if (!map || !layer) return;

    // Clear existing markers
    layer.clearLayers();

    if (markers.length === 0) return;

    const bounds = L.latLngBounds([]);

    markers.forEach((marker, index) => {
      // Validate coordinates to prevent leaflet crashes
      const lat = Number(marker.lat);
      const lng = Number(marker.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const customIcon = getMarkerIcon(marker.type, index);

      const leafletMarker = L.marker([lat, lng], { icon: customIcon })
        .bindPopup(`
          <div class="p-1 font-sans">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                marker.type === "morning" ? "bg-[#E9EDC9] text-[#5A5A40]" :
                marker.type === "afternoon" ? "bg-[#FAEED1] text-[#D4A373]" :
                marker.type === "evening" ? "bg-[#F5F2ED] text-[#7D7667]" : "bg-[#EAE7E0] text-[#33332D]"
              }">
                ${marker.timeOfDay}
              </span>
            </div>
            <h3 class="font-serif font-bold text-sm text-[#33332D] leading-tight">${marker.title}</h3>
            <p class="text-xs text-[#7D7667] mt-1">${marker.description}</p>
          </div>
        `, { maxWidth: 220 });

      leafletMarker.addTo(layer);
      bounds.extend([lat, lng]);
    });

    // Auto fit map bounds with some padding if we have valid elements
    if (markers.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [markers, activeDay]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md border border-[#DCD7CC]">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "350px" }} />
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl text-xs shadow-sm border border-[#DCD7CC]">
        <div className="font-bold text-[#33332D] mb-1">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#5A5A40]"></span>
            <span className="text-[#7D7667] font-semibold">Morning Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D4A373]"></span>
            <span className="text-[#7D7667] font-semibold">Afternoon Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7D7667]"></span>
            <span className="text-[#7D7667] font-semibold">Evening Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C29262] animate-pulse"></span>
            <span className="text-[#7D7667] font-semibold">Destination Center</span>
          </div>
        </div>
      </div>
    </div>
  );
}
