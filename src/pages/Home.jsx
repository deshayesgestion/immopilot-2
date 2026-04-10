import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAgency } from "../hooks/useAgency";
import HeroSection from "../components/home/HeroSection";
import AgencySection from "../components/home/AgencySection";
import StatsSection from "../components/home/StatsSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CTASection from "../components/home/CTASection";
import FeaturedProperties from "../components/home/FeaturedProperties";

export default function Home() {
  const { agency } = useAgency();
  const [featuredProperties, setFeaturedProperties] = useState([]);

  useEffect(() => {
    base44.entities.Property.filter({ featured: true, status: "disponible" }, "-created_date", 6)
      .then(setFeaturedProperties);
  }, []);

  return (
    <div>
      <HeroSection
        agencyName={agency?.name}
        slogan={agency?.slogan}
      />
      <FeaturedProperties properties={featuredProperties} />
      <AgencySection agency={agency} />
      <StatsSection />
      <TestimonialsSection />
      <CTASection agencyName={agency?.name} />
    </div>
  );
}