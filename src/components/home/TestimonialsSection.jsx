import AnimatedSection from "../AnimatedSection";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Marie & Julien B.",
    role: "Acheteurs, Paris 8e",
    content: "Une agence à l'écoute, professionnelle et réactive. Notre appartement a été vendu en moins de 3 semaines, au prix demandé.",
    rating: 5,
  },
  {
    name: "Philippe D.",
    role: "Vendeur, Bordeaux",
    content: "Estimation juste du marché, communication parfaite et accompagnement jusqu'à la signature. Je recommande sans hésitation.",
    rating: 5,
  },
  {
    name: "Camille R.",
    role: "Locataire, Lyon",
    content: "Service impeccable, disponible et à l'écoute. J'ai trouvé mon appartement en une semaine. Équipe très professionnelle.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary mb-3">Témoignages</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ils nous font confiance.
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, index) => (
            <AnimatedSection key={index} delay={index * 120}>
              <div className="bg-white rounded-2xl p-7 border border-border/50 h-full flex flex-col shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
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