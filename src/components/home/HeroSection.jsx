import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/50 via-background to-background" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-accent-foreground">Propulsé par l'IA</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.08] animate-fade-up" style={{ animationDelay: "0.1s" }}>
            L'immobilier réinventé
            <br />
            <span className="text-primary">par l'intelligence artificielle.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
            ImmoPilot automatise la gestion, l'estimation et la diffusion de vos biens immobiliers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/vente">
              <Button size="lg" className="rounded-full px-8 h-12 text-sm font-medium gap-2 shadow-lg shadow-primary/25">
                Découvrir les biens
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/estimation">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-sm font-medium">
                Estimer un bien
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 lg:mt-24 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50">
            <img
              src={heroImage}
              alt="ImmoPilot Dashboard"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}