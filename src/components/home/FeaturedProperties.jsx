import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PropertyCard from "../PropertyCard";
import AnimatedSection from "../AnimatedSection";
import { ArrowRight } from "lucide-react";

export default function FeaturedProperties({ properties }) {
  if (!properties?.length) return null;

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Biens à la une</h2>
              <p className="mt-1.5 text-muted-foreground">Notre sélection du moment</p>
            </div>
            <Link to="/vente">
              <Button variant="ghost" className="gap-2 text-sm">Voir tout <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p, i) => (
            <AnimatedSection key={p.id} delay={i * 100}>
              <PropertyCard property={p} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}