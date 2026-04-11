import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { MapPin, ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

async function geocode(address) {
  const query = encodeURIComponent(address + ", France");
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=fr`,
    { headers: { "Accept-Language": "fr" } }
  );
  const data = await res.json();
  if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  return null;
}

export default function MiniMap({ property }) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCoords(null);
    setLoading(true);

    if (property.latitude && property.longitude) {
      setCoords({ lat: property.latitude, lon: property.longitude });
      setLoading(false);
      return;
    }

    const fullAddress = [property.address, property.city, property.postal_code].filter(Boolean).join(", ");
    const cityOnly = [property.city, property.postal_code].filter(Boolean).join(", ");
    const addressToTry = fullAddress || cityOnly;

    if (!addressToTry) {
      setLoading(false);
      return;
    }

    geocode(addressToTry)
      .then(async (c) => {
        if (!c && fullAddress && cityOnly && fullAddress !== cityOnly) {
          return geocode(cityOnly);
        }
        return c;
      })
      .then((c) => {
        setCoords(c || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [property.id]);

  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : `https://www.google.com/maps/search/${encodeURIComponent([property.address, property.city].filter(Boolean).join(", "))}`;

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50" style={{ height: 220 }}>
      {loading ? (
        <div className="w-full h-full bg-secondary/40 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-muted-foreground/40 animate-pulse" />
        </div>
      ) : !coords ? (
        <div className="w-full h-full bg-secondary/40 flex flex-col items-center justify-center gap-2">
          <MapPin className="w-5 h-5 text-muted-foreground/30" />
          <span className="text-xs text-muted-foreground/50">Localisation non disponible</span>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary hover:underline">
            Rechercher sur Google Maps →
          </a>
        </div>
      ) : (
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
      )}

      {coords && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm hover:bg-white transition-colors font-medium text-foreground/70 hover:text-foreground z-[500]"
        >
          <ExternalLink className="w-3 h-3" />
          Google Maps
        </a>
      )}
    </div>
  );
}