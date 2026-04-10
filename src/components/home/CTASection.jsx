import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import AnimatedSection from "../AnimatedSection";

export default function CTASection({ agencyName }) {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="relative overflow-hidden bg-[#0F0F10] text-white rounded-3xl p-10 sm:p-16 text-center">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #4F46E5 0%, transparent 60%), radial-gradient(circle at 70% 50%, #818CF8 0%, transparent 60%)" }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Vous souhaitez vendre<br />ou acheter un bien ?
              </h2>
              <p className="mt-5 text-lg text-white/60 max-w-lg mx-auto">
                Notre équipe est à votre écoute pour vous accompagner dans votre projet immobilier.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Link to="/contact">
                  <Button size="lg" className="rounded-full px-8 h-12 text-sm font-medium gap-2 bg-white text-black hover:bg-white/90">
                    Contacter l'agence
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/estimation">
                  <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-sm font-medium border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                    Estimer mon bien
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}