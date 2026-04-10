import AnimatedSection from "../AnimatedSection";

const stats = [
  { value: "+2 500", label: "Biens vendus" },
  { value: "+1 200", label: "Clients accompagnés" },
  { value: "15 ans", label: "D'expérience" },
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-[#0F0F10] text-white">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {stats.map((stat, index) => (
              <div key={index} className="text-center py-10 px-6">
                <div className="text-5xl lg:text-6xl font-bold tracking-tight">{stat.value}</div>
                <div className="mt-2 text-base text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}