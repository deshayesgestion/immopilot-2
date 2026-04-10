import AnimatedSection from "../AnimatedSection";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sophie Martin",
    role: "Directrice, Agence Prestige Lyon",
    content: "ImmoPilot a transformé notre façon de travailler. La diffusion automatique nous fait gagner un temps précieux chaque jour.",
    rating: 5,
  },
  {
    name: "Thomas Dubois",
    role: "Agent immobilier, Paris",
    content: "L'estimation par IA est remarquablement précise. Nos clients sont impressionnés par la rapidité et la qualité du service.",
    rating: 5,
  },
  {
    name: "Claire Bernard",
    role: "Gérante, Immobilier Sud",
    content: "Le CRM intégré nous permet de ne manquer aucun prospect. Notre taux de conversion a augmenté de 40% depuis l'adoption d'ImmoPilot.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Ils nous font confiance.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Découvrez ce que disent les professionnels qui utilisent ImmoPilot au quotidien.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <AnimatedSection key={index} delay={index * 150}>
              <div className="bg-card rounded-2xl p-7 border border-border/50 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">"{t.content}"</p>
                <div className="mt-6 pt-5 border-t border-border/50">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}