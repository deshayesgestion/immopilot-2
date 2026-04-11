import { Link } from "react-router-dom";
import MiniMap from "./MiniMap";
import { Heart, MapPin, Maximize, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PropertyCard({ property, onFavorite }) {
  const [isFav, setIsFav] = useState(false);
  const image = property.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800";

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  };

  const typeLabels = {
    maison: "Maison",
    appartement: "Appartement",
    terrain: "Terrain",
    local_commercial: "Local commercial",
    bureau: "Bureau",
  };

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium">
            {typeLabels[property.type] || property.type}
          </span>
          {property.status === "sous_compromis" && (
            <span className="px-3 py-1 bg-orange-500/90 text-white backdrop-blur-sm rounded-full text-xs font-medium">
              Sous compromis
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFav(!isFav);
            onFavorite?.(property.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors hover:bg-background"
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">{property.title}</h3>
          <span className="text-lg font-bold text-primary whitespace-nowrap">
            {formatPrice(property.price)}
            {property.transaction === "location" && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-sm">{property.city}{property.postal_code ? ` (${property.postal_code})` : ""}</span>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Maximize className="w-3.5 h-3.5" />
            <span>{property.surface} m²</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BedDouble className="w-3.5 h-3.5" />
            <span>{property.rooms} pièces</span>
          </div>
        </div>

        <MiniMap property={property} />

        <Link to={`/bien/${property.id}`}>
          <Button variant="outline" size="sm" className="w-full mt-4 rounded-full">
            Voir détails
          </Button>
        </Link>
      </div>
    </div>
  );
}