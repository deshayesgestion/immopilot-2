import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import AnimatedSection from "../components/AnimatedSection";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.ContactMessage.create(form);
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Contactez-nous
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <AnimatedSection delay={100} className="lg:col-span-3">
            {sent ? (
              <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Message envoyé</h2>
                <p className="text-muted-foreground">
                  Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 rounded-full"
                  onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", message: "" }); }}
                >
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/50 p-8 space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nom complet</label>
                  <Input
                    required
                    placeholder="Jean Dupont"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      required
                      type="email"
                      placeholder="jean@email.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Téléphone</label>
                    <Input
                      placeholder="06 12 34 56 78"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    required
                    placeholder="Comment pouvons-nous vous aider ?"
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className="rounded-xl min-h-[120px] resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full h-12 text-sm font-medium gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Envoyer le message
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </AnimatedSection>

          <AnimatedSection delay={200} className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border border-border/50 p-7">
              <h3 className="font-semibold mb-5">Informations de contact</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">contact@immopilot.fr</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Téléphone</p>
                    <p className="text-sm text-muted-foreground">01 23 45 67 89</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">12 Avenue des Champs-Élysées<br />75008 Paris</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-2xl aspect-[4/3] flex items-center justify-center">
              <MapPin className="w-10 h-10 text-muted-foreground/30" />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}