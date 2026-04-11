import { useState, useEffect, useRef } from "react";
import { MapPin, ExternalLink } from "lucide-react";

// Lazy-loaded Leaflet map — only mounts when visible in viewport
// Geocodes address via Nominatim if no lat/lon provided

let leafletLoaded = false;
let L = null;

async function loadLeaflet() {
  if (leafletLoaded) return L;
  const mod = await import("leaflet");
  L = mod.default || mod;
  // Fix default marker icons
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
  // Load Leaflet CSS dynamically
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
  leafletLoaded = true;
  return L;
}

async function geocode(address) {
  const query = encodeURIComponent(address);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
  const data = await res.json();
  if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  return null;
}

export default function MiniMap({ property }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(false);

  // Lazy: only activate when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Resolve coordinates
  useEffect(() => {
    if (!visible) return;
    if (property.latitude && property.longitude) {
      setCoords({ lat: property.latitude, lon: property.longitude });
      return;
    }
    const address = [property.address, property.city, property.postal_code].filter(Boolean).join(", ");
    if (!address) { setError(true); return; }
    geocode(address).then((c) => {
      if (c) setCoords(c);
      else setError(true);
    });
  }, [visible, property]);

  // Mount Leaflet map
  useEffect(() => {
    if (!coords || !mapRef.current || mapInstanceRef.current) return;
    loadLeaflet().then((Leaflet) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = Leaflet.map(mapRef.current, {
        center: [coords.lat, coords.lon],
        zoom: 15,
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
        attributionControl: false,
      });
      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      Leaflet.marker([coords.lat, coords.lon]).addTo(map);
      mapInstanceRef.current = map;
    });
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords]);

  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : `https://www.google.com/maps/search/${encodeURIComponent([property.address, property.city].filter(Boolean).join(", "))}`;

  return (
    <div ref={containerRef} className="relative mt-3 rounded-xl overflow-hidden border border-border/50" style={{ height: 140 }}>
      {!visible || (!coords && !error) ? (
        <div className="w-full h-full bg-secondary/40 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-muted-foreground/30 animate-pulse" />
        </div>
      ) : error ? (
        <div className="w-full h-full bg-secondary/40 flex flex-col items-center justify-center gap-1">
          <MapPin className="w-4 h-4 text-muted-foreground/30" />
          <span className="text-xs text-muted-foreground/40">Carte indisponible</span>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full" />
      )}
      {/* Overlay button */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm hover:bg-white transition-colors font-medium text-foreground/70 hover:text-foreground z-[500]"
      >
        <ExternalLink className="w-3 h-3" />
        Google Maps
      </a>
    </div>
  );
}