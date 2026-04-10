import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedSection from "../components/AnimatedSection";

export default function PropertiesRent() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({ search: "", type: "all", sort: "newest" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await base44.entities.Property.filter({ transaction: "location", status: "disponible" }, "-created_date", 50);
      setProperties(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...properties];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(p =>
        p.city?.toLowerCase().includes(s) ||
        p.postal_code?.includes(s) ||
        p.title?.toLowerCase().includes(s)
      );
    }
    if (filters.type && filters.type !== "all") result = result.filter(p => p.type === filters.type);
    if (filters.priceMin) result = result.filter(p => p.price >= Number(filters.priceMin));
    if (filters.priceMax) result = result.filter(p => p.price <= Number(filters.priceMax));
    if (filters.surfaceMin) result = result.filter(p => p.surface >= Number(filters.surfaceMin));
    if (filters.roomsMin) result = result.filter(p => p.rooms >= Number(filters.roomsMin));
    if (filters.condition && filters.condition !== "all") result = result.filter(p => p.condition === filters.condition);

    if (filters.sort === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (filters.sort === "price_desc") result.sort((a, b) => b.price - a.price);

    return result;
  }, [properties, filters]);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Biens à louer</h1>
            <p className="mt-2 text-muted-foreground">
              Trouvez votre prochain logement parmi notre sélection de biens en location.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <PropertyFilters filters={filters} onFilterChange={setFilters} transaction="location" />
        </AnimatedSection>

        <div className="flex items-center justify-between mt-8 mb-6">
          <p className="text-sm text-muted-foreground">
            {filtered.length} bien{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-1">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("list")}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-lg text-muted-foreground">Aucun bien trouvé.</p>
            <p className="text-sm text-muted-foreground mt-1">Essayez de modifier vos critères de recherche.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filtered.map((property) => (
              <AnimatedSection key={property.id} delay={0}>
                <PropertyCard property={property} />
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}