import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import AnimatedSection from "../AnimatedSection";

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="bg-gradient-to-br from-primary/10 via-accent to-primary/5 rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Prêt à transformer votre agence ?
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
              Rejoignez les 500+ agences qui utilisent ImmoPilot pour automatiser leur activité immobilière.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link to="/contact">
                <Button size="lg" className="rounded-full px-8 h-12 text-sm font-medium gap-2 shadow-lg shadow-primary/25">
                  Nous contacter
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/estimation">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-sm font-medium">
                  Essayer l'estimation IA
                </Button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}