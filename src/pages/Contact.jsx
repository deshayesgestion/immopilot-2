import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import AnimatedSection from "../components/AnimatedSection";
import { useAgency } from "../hooks/useAgency";

export default function Contact() {
  const { agency } = useAgency();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.ContactMessage.create({ ...form, agency_id: agency?.id || "default" });
    setSent(true);
    setLoading(false);
  };

  const contacts = [
    agency?.phone && { icon: Phone, label: "Téléphone", value: agency.phone },
    agency?.email && { icon: Mail, label: "Email", value: agency.email },
    (agency?.address || agency?.city) && { icon: MapPin, label: "Adresse", value: [agency?.address, agency?.city, agency?.postal_code].filter(Boolean).join(", ") },
  ].filter(Boolean);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary mb-4">Nous joindre</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Contactez-nous</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
              Notre équipe vous répond dans les meilleurs délais.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <AnimatedSection delay={100} className="lg:col-span-3">
            {sent ? (
              <div className="bg-white rounded-2xl border border-border/50 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Message envoyé</h2>
                <p className="text-muted-foreground text-sm">Nous vous répondrons dans les plus brefs délais.</p>
                <Button variant="outline" className="mt-6 rounded-full" onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", message: "" }); }}>
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nom complet</label>
                  <Input required placeholder="Jean Dupont" value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input required type="email" placeholder="jean@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Téléphone</label>
                    <Input placeholder="06 12 34 56 78" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Votre message</label>
                  <Textarea required placeholder="Comment pouvons-nous vous aider ?" value={form.message} onChange={(e) => handleChange("message", e.target.value)} className="rounded-xl min-h-[130px] resize-none" />
                </div>
                <Button type="submit" size="lg" className="w-full rounded-full h-12 text-sm font-medium gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Envoyer le message</span><ArrowRight className="w-4 h-4" /></>}
                </Button>
              </form>
            )}
          </AnimatedSection>

          <AnimatedSection delay={200} className="lg:col-span-2 space-y-5">
            {contacts.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-7">
                <h3 className="font-semibold mb-5">Nos coordonnées</h3>
                <div className="space-y-5">
                  {contacts.map(({ icon: Icon, label, value }, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-secondary/50 rounded-2xl aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
              <MapPin className="w-8 h-8" />
              <span className="text-xs">Carte de localisation</span>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}