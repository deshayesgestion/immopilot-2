import { useState, useEffect } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

async function geocode(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    { headers: { "Accept-Language": "fr" } }
  );
  const data = await res.json();
  if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  return null;
}

export default function MiniMap({ property }) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  const address = [property.address, property.city, property.postal_code, "France"]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    setCoords(null);
    setLoading(true);
    geocode(address)
      .then(setCoords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span>{[property.address, property.city, property.postal_code].filter(Boolean).join(", ")}</span>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-secondary/40" style={{ height: 240 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-secondary/60">
            <MapPin className="w-5 h-5 text-muted-foreground/40 animate-pulse" />
          </div>
        )}

        {!loading && !coords && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <MapPin className="w-5 h-5 text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/50">Adresse introuvable sur la carte</span>
          </div>
        )}

        {!loading && coords && (
          <>
            <MapContainer
              key={`${coords.lat}-${coords.lon}`}
              center={[coords.lat, coords.lon]}
              zoom={15}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
              doubleClickZoom={false}
              touchZoom={false}
              keyboard={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[coords.lat, coords.lon]} />
            </MapContainer>

            <a
              href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=16/${coords.lat}/${coords.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm hover:bg-white transition-colors font-medium text-foreground/70 z-[500]"
            >
              <ExternalLink className="w-3 h-3" />
              Voir sur la carte
            </a>
          </>
        )}
      </div>
    </div>
  );
}