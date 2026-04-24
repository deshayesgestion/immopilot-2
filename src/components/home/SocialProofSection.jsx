import { Star, TrendingUp, Home, Users } from "lucide-react";
import AnimatedSection from "../AnimatedSection";

// Section preuve sociale enrichie avec avis + chiffres clés dynamiques
export default function SocialProofSection({ agency }) {
  const testimonials = agency?.lp_testimonials?.length ? agency.lp_testimonials : [
    { name: "Marie L.", role: "Propriétaire vendeuse", text: "Vente réalisée en 3 semaines, au prix demandé. Équipe au top !" },
    { name: "Pierre D.", role: "Acquéreur", text: "Très professionnel, réactif. J'ai trouvé mon appartement idéal." },
    { name: "Sophie M.", role: "Investisseur", text: "Gestion locative parfaite. Je recommande les yeux fermés." },
  ];

  const stats = agency?.lp_stats?.length ? agency.lp_stats : [
    { value: "500+", label: "Biens vendus", icon: Home },
    { value: "98%", label: "Clients satisfaits", icon: Users },
    { value: "15 ans", label: "D'expérience", icon: TrendingUp },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-16">

        {/* Chiffres clés */}
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Nos résultats</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Une agence qui performe</h2>
          </div>
          <div className={`grid grid-cols-2 md:grid-cols-${Math.min(stats.length, 4)} gap-4`}>
            {stats.map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 text-center border border-border/30">
                <p className="text-3xl sm:text-4xl font-black tracking-tight text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Avis clients */}
        <AnimatedSection>
          <div className="text-center mb-10">
            <div className="flex justify-center gap-0.5 mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Avis clients</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ce que disent nos clients</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-border/30 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="mt-auto">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}