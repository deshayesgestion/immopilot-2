export default function ServicesSection({ services = [] }) {
  if (!services.length) return null;
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Nos services</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Un accompagnement expert à chaque étape de votre projet immobilier.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div key={i} className="group p-6 rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all text-center bg-white">
              <span className="text-4xl mb-4 block">{service.icon}</span>
              <h3 className="text-base font-bold mb-2">{service.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}