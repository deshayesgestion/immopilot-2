import AnimatedSection from "../AnimatedSection";

const stats = [
  { value: "10 000+", label: "Biens gérés" },
  { value: "500+", label: "Agences partenaires" },
  { value: "-60%", label: "Temps administratif" },
];

export default function StatsSection() {
  return (
    <section className="py-24 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">{stat.value}</div>
                <div className="mt-2 text-lg opacity-60">{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}