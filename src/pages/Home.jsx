import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAgency } from "../hooks/useAgency";
import HeroSection from "../components/home/HeroSection";
import AgencySection from "../components/home/AgencySection";
import StatsSection from "../components/home/StatsSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CTASection from "../components/home/CTASection";
import FeaturedProperties from "../components/home/FeaturedProperties";
import ServicesSection from "../components/home/ServicesSection";

export default function Home() {
  const { agency } = useAgency();
  const [featuredBiens, setFeaturedBiens] = useState([]);

  useEffect(() => {
    if (!agency) return;
    const ids = agency.lp_featured_biens_ids;
    if (ids && ids.length > 0) {
      // Charger les biens sélectionnés manuellement
      Promise.all(ids.slice(0, 6).map(id => base44.entities.Bien.filter({ id }))).then(results => {
        setFeaturedBiens(results.flat().filter(Boolean));
      });
    } else {
      // Fallback : biens disponibles
      const typeFilter = agency.lp_featured_filter;
      const filter = typeFilter && typeFilter !== "all" ? { statut: "disponible", type: typeFilter } : { statut: "disponible" };
      base44.entities.Bien.filter(filter, "-created_date", 6).then(setFeaturedBiens);
    }
  }, [agency]);

  if (!agency) return null;

  return (
    <div>
      {agency.lp_section_hero_enabled !== false && (
        <HeroSection
          agencyName={agency.lp_hero_title || agency.name}
          slogan={agency.lp_hero_subtitle || agency.slogan}
          heroImageUrl={agency.hero_image_url}
          logoUrl={agency.logo_url}
          cta1Label={agency.lp_hero_cta1_label}
          cta1Url={agency.lp_hero_cta1_url}
          cta2Label={agency.lp_hero_cta2_label}
          cta2Url={agency.lp_hero_cta2_url}
        />
      )}
      {agency.lp_section_featured_enabled !== false && featuredBiens.length > 0 && (
        <FeaturedProperties properties={featuredBiens} />
      )}
      {agency.lp_section_agency_enabled !== false && (
        <AgencySection agency={agency} />
      )}
      {agency.lp_section_services_enabled !== false && agency.lp_services?.length > 0 && (
        <ServicesSection services={agency.lp_services} />
      )}
      {agency.lp_section_stats_enabled !== false && (
        <StatsSection stats={agency.lp_stats} />
      )}
      {agency.lp_section_testimonials_enabled !== false && (
        <TestimonialsSection testimonials={agency.lp_testimonials} />
      )}
      {agency.lp_section_contact_enabled !== false && (
        <CTASection agencyName={agency.name} agency={agency} />
      )}
    </div>
  );
}