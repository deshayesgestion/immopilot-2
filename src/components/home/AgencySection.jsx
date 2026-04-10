import AnimatedSection from "../AnimatedSection";
import { CheckCircle } from "lucide-react";

const points = [
  { label: "Accompagnement personnalisé", desc: "Un agent dédié à chaque projet, de la recherche à la signature." },
  { label: "Estimation précise", desc: "Une connaissance approfondie du marché local pour une valorisation juste." },
  { label: "Réseau local solide", desc: "15 ans de présence sur le terrain et un carnet d'adresses éprouvé." },
];

export default function AgencySection({ agency }) {
  const description = agency?.description ||
    "Depuis plus de 15 ans, notre agence accompagne vendeurs et acheteurs dans leurs projets immobiliers avec exigence et bienveillance.";

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary mb-4">Notre agence</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Une expertise locale reconnue.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
            <div className="mt-8 space-y-5">
              {points.map((p, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80"
                  alt="Agence immobilière"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl p-5 border border-border/50">
                <p className="text-2xl font-bold">+15 ans</p>
                <p className="text-sm text-muted-foreground">d'expertise locale</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}