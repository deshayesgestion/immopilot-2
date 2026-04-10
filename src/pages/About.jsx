import { Brain, Shield, Zap, Heart, Target, Users } from "lucide-react";
import AnimatedSection from "../components/AnimatedSection";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const values = [
  { icon: Brain, title: "Innovation", description: "Nous repoussons les limites de la technologie au service de l'immobilier." },
  { icon: Shield, title: "Fiabilité", description: "Des estimations précises et des données sécurisées pour vos clients." },
  { icon: Zap, title: "Performance", description: "Des outils rapides et efficaces qui font gagner du temps à votre agence." },
  { icon: Heart, title: "Proximité", description: "Un accompagnement personnalisé pour chaque agence partenaire." },
];

const team = [
  { name: "Marie Laurent", role: "CEO & Fondatrice", desc: "15 ans d'expérience dans la PropTech" },
  { name: "Pierre Moreau", role: "CTO", desc: "Expert en IA et machine learning" },
  { name: "Julie Petit", role: "Head of Product", desc: "Ancienne directrice d'agence immobilière" },
];

export default function About() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              À propos d'ImmoPilot
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Nous croyons que la technologie peut transformer l'immobilier. Notre mission est de donner aux agences les outils IA les plus avancés pour exceller dans leur métier.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-24">
            <div className="bg-foreground text-background rounded-2xl p-10 flex flex-col justify-between min-h-[240px]">
              <Target className="w-8 h-8 opacity-50" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Notre mission</h3>
                <p className="opacity-70 leading-relaxed">Automatiser et simplifier l'immobilier grâce à l'intelligence artificielle, pour que les agents se concentrent sur l'essentiel : leurs clients.</p>
              </div>
            </div>
            <div className="bg-accent rounded-2xl p-10 flex flex-col justify-between min-h-[240px]">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Notre vision</h3>
                <p className="text-muted-foreground leading-relaxed">Devenir la référence européenne de la PropTech en offrant aux agences une plateforme tout-en-un, intelligente et intuitive.</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Nos valeurs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-24">
            {values.map((v, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 p-7">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-5">
                  <v.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">L'équipe</h2>
            <p className="mt-3 text-muted-foreground">Les esprits derrière ImmoPilot.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-24">
            {team.map((t, i) => (
              <div key={i} className="text-center bg-card rounded-2xl border border-border/50 p-8">
                <div className="w-20 h-20 rounded-full bg-accent mx-auto mb-5 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{t.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-sm text-primary font-medium mt-1">{t.role}</p>
                <p className="text-sm text-muted-foreground mt-2">{t.desc}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <div className="bg-gradient-to-br from-primary/10 via-accent to-primary/5 rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Rejoignez l'aventure ImmoPilot
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Transformez votre agence avec les outils de demain, disponibles aujourd'hui.
            </p>
            <Link to="/contact">
              <Button size="lg" className="mt-8 rounded-full px-8 h-12 text-sm font-medium gap-2 shadow-lg shadow-primary/25">
                Nous contacter
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}