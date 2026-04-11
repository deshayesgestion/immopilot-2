import { MapPin } from "lucide-react";

export default function MiniMap({ property }) {
  const address = [property.address, property.city, property.postal_code].filter(Boolean).join(", ");

  return (
    <div className="flex items-start gap-3 p-4 bg-secondary/40 rounded-xl border border-border/50">
      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
        <MapPin className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">Localisation</p>
        <p className="text-sm font-medium">{address || "Adresse non renseignée"}</p>
      </div>
    </div>
  );
}