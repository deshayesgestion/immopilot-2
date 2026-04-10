import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PropertyFilters({ filters, onFilterChange, transaction }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ville, code postal..."
            value={filters.search || ""}
            onChange={(e) => handleChange("search", e.target.value)}
            className="pl-10 rounded-full bg-secondary/50 border-0 h-11"
          />
        </div>
        <Select value={filters.type || "all"} onValueChange={(v) => handleChange("type", v)}>
          <SelectTrigger className="w-full sm:w-48 rounded-full bg-secondary/50 border-0 h-11">
            <SelectValue placeholder="Type de bien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="maison">Maison</SelectItem>
            <SelectItem value="appartement">Appartement</SelectItem>
            <SelectItem value="terrain">Terrain</SelectItem>
            <SelectItem value="local_commercial">Local commercial</SelectItem>
            <SelectItem value="bureau">Bureau</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="rounded-full h-11 gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
        </Button>
      </div>

      {showAdvanced && (
        <div className="bg-secondary/30 rounded-2xl p-5 animate-fade-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prix min</label>
            <Input
              type="number"
              placeholder="0 €"
              value={filters.priceMin || ""}
              onChange={(e) => handleChange("priceMin", e.target.value)}
              className="rounded-lg bg-background border-border/50 h-10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prix max</label>
            <Input
              type="number"
              placeholder="Illimité"
              value={filters.priceMax || ""}
              onChange={(e) => handleChange("priceMax", e.target.value)}
              className="rounded-lg bg-background border-border/50 h-10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Surface min (m²)</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.surfaceMin || ""}
              onChange={(e) => handleChange("surfaceMin", e.target.value)}
              className="rounded-lg bg-background border-border/50 h-10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pièces min</label>
            <Input
              type="number"
              placeholder="1"
              value={filters.roomsMin || ""}
              onChange={(e) => handleChange("roomsMin", e.target.value)}
              className="rounded-lg bg-background border-border/50 h-10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">État</label>
            <Select value={filters.condition || "all"} onValueChange={(v) => handleChange("condition", v)}>
              <SelectTrigger className="rounded-lg bg-background border-border/50 h-10">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="neuf">Neuf</SelectItem>
                <SelectItem value="renove">Rénové</SelectItem>
                <SelectItem value="bon_etat">Bon état</SelectItem>
                <SelectItem value="a_renover">À rénover</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tri</label>
            <Select value={filters.sort || "newest"} onValueChange={(v) => handleChange("sort", v)}>
              <SelectTrigger className="rounded-lg bg-background border-border/50 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Plus récents</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange({ search: "", type: "all", sort: "newest" })}
              className="text-muted-foreground gap-1"
            >
              <X className="w-3.5 h-3.5" /> Réinitialiser
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}