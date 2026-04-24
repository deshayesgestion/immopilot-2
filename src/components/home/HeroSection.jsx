import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, TrendingUp, CalendarCheck } from "lucide-react";

const HERO_BG_DEFAULT = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=85";

export default function HeroSection({
  agencyName, slogan,
  heroImageUrl, logoUrl,
  cta1Label, cta1Url,
  cta2Label, cta2Url,
  agency,
}) {
  const name = agencyName || "Agence Immobilière";
  const tagline = slogan || "Des biens d'exception au cœur de votre région.";
  const bg = heroImageUrl || HERO_BG_DEFAULT;
  const c1Label = cta1Label || "Découvrir les biens";
  const c1Url = cta1Url || "/vente";
  const c2Label = cta2Label || "Faire estimer mon bien";
  const c2Url = cta2Url || "/estimation";

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={bg} alt="Bien immobilier" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
      </div>

      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        {logoUrl && (
          <img src={logoUrl} alt="logo" className="h-14 mx-auto mb-6 object-contain animate-fade-up" />
        )}
        <p className="text-sm font-medium tracking-[0.2em] uppercase opacity-70 mb-6 animate-fade-up">
          Agence Immobilière
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {name}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {tagline}
        </p>

        {/* CTAs principaux */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Link to={c1Url}>
            <Button size="lg" className="rounded-full px-8 h-12 text-sm font-medium gap-2 bg-white text-black hover:bg-white/90 shadow-xl">
              {c1Label} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to={c2Url}>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-sm font-medium border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent">
              {c2Label}
            </Button>
          </Link>
        </div>

        {/* 3 actions rapides dans le hero */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 animate-fade-up" style={{ animationDelay: "0.45s" }}>
          {[
            { icon: CalendarCheck, label: "Demander une visite", href: "#cta-strip", isAnchor: true },
            { icon: TrendingUp,    label: "Estimer mon bien",    href: "/estimation" },
            { icon: Phone,         label: "Être rappelé",        href: `tel:${agency?.phone?.replace(/\s/g,"")}`, isPhone: !!agency?.phone },
          ].map((a, i) => {
            const Icon = a.icon;
            const Tag = a.isPhone || a.isAnchor ? "a" : Link;
            const linkProp = a.isPhone || a.isAnchor ? { href: a.href } : { to: a.href };
            return (
              <Tag key={i} {...linkProp}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-full px-4 py-2 text-white text-xs font-medium transition-all backdrop-blur-sm">
                <Icon className="w-3.5 h-3.5" />{a.label}
              </Tag>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
        <div className="w-px h-8 bg-white/30" />
      </div>
    </section>
  );
}