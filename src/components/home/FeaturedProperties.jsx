import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PropertyCard from "../PropertyCard";
import AnimatedSection from "../AnimatedSection";
import { ArrowRight } from "lucide-react";

export default function FeaturedProperties({ properties }) {
  if (!properties?.length) return null;

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary mb-3">Sélection</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Nos derniers biens</h2>
            </div>
            <Link to="/vente">
              <Button variant="ghost" className="gap-2 text-sm hidden sm:flex">
                Voir tous les biens <ArrowRight className="w-4 h-4" />
              </Button>
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

        <div className="mt-10 text-center sm:hidden">
          <Link to="/vente">
            <Button variant="outline" className="rounded-full gap-2">
              Voir tous les biens <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}