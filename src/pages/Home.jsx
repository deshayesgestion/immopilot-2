import HeroSection from "../components/home/HeroSection";
import FeaturesSection from "../components/home/FeaturesSection";
import StatsSection from "../components/home/StatsSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CTASection from "../components/home/CTASection";

const HERO_IMAGE = "/__generating__/img_c2fa0a857d22.png";

export default function Home() {
  return (
    <div>
      <HeroSection heroImage={HERO_IMAGE} />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}