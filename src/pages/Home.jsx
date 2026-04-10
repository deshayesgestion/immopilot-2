import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAgency } from "../hooks/useAgency";
import HeroSection from "../components/home/HeroSection";
import FeaturesSection from "../components/home/FeaturesSection";
import StatsSection from "../components/home/StatsSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CTASection from "../components/home/CTASection";
import FeaturedProperties from "../components/home/FeaturedProperties";

const HERO_IMAGE = "/__generating__/img_c2fa0a857d22.png";

export default function Home() {
  const { agency } = useAgency();
  const [featuredProperties, setFeaturedProperties] = useState([]);

  useEffect(() => {
    base44.entities.Property.filter({ featured: true, status: "disponible" }, "-created_date", 3)
      .then(setFeaturedProperties);
  }, []);

  return (
    <div>
      <HeroSection
        heroImage={HERO_IMAGE}
        agencyName={agency?.name}
        slogan={agency?.slogan}
        primaryColor={agency?.primary_color}
      />
      <FeaturedProperties properties={featuredProperties} />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection agencyName={agency?.name} />
    </div>
  );
}