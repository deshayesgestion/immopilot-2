import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=85";

export default function HeroSection({ agencyName, slogan }) {
  const name = agencyName || "Agence Dupont Immobilier";
  const tagline = slogan || "Des biens d'exception au cœur de votre région.";

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt="Bien immobilier"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <p className="text-sm font-medium tracking-[0.2em] uppercase opacity-70 mb-6 animate-fade-up">
          Agence Immobilière
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {name}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {tagline}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Link to="/vente">
            <Button size="lg" className="rounded-full px-8 h-12 text-sm font-medium gap-2 bg-white text-black hover:bg-white/90 shadow-xl">
              Découvrir les biens
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/estimation">
            <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-sm font-medium border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent">
              Faire estimer mon bien
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
        <div className="w-px h-8 bg-white/30" />
      </div>
    </section>
  );
}