import { Zap, Brain, Globe, Users } from "lucide-react";
import AnimatedSection from "../AnimatedSection";

const features = [
  {
    icon: Zap,
    title: "Automatisation intelligente",
    description: "Publication automatique des annonces et diffusion multi-portails en un clic.",
    detail: "Gagnez des heures chaque semaine grâce à l'automatisation complète du processus de publication."
  },
  {
    icon: Brain,
    title: "Estimation immobilière IA",
    description: "Analyse de marché automatisée pour des estimations rapides et précises.",
    detail: "Notre modèle d'IA analyse des milliers de transactions pour vous fournir une estimation fiable."
  },
  {
    icon: Globe,
    title: "Diffusion des biens",
    description: "Gestion centralisée de toutes vos annonces sur les principaux portails.",
    detail: "Une seule interface pour gérer la visibilité de vos biens sur tous les canaux de diffusion."
  },
  {
    icon: Users,
    title: "CRM immobilier intelligent",
    description: "Suivi des clients et automatisation des leads pour ne manquer aucune opportunité.",
    detail: "Qualifiez vos prospects automatiquement et priorisez les plus prometteurs."
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 lg:py-40">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Tout ce dont votre agence a besoin.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Des outils puissants conçus pour les professionnels de l'immobilier.
          </p>
        </AnimatedSection>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 100}>
              <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}>
                <div className="flex-1 space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{feature.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{feature.description}</p>
                  <p className="text-muted-foreground leading-relaxed">{feature.detail}</p>
                </div>
                <div className="flex-1 w-full">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-accent via-secondary to-accent border border-border/50 flex items-center justify-center">
                    <feature.icon className="w-20 h-20 text-primary/20" />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}