import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Phone, CalendarCheck, TrendingUp, Loader2, CheckCircle2 } from "lucide-react";
import AnimatedSection from "../AnimatedSection";
import { base44 } from "@/api/base44Client";

export default function CTASection({ agencyName, agency }) {
  const [form, setForm] = useState({ nom: "", telephone: "", type: "contact" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const color = agency?.primary_color || "#4F46E5";

  const submit = async () => {
    if (!form.nom || !form.telephone) return;
    setSending(true);
    let contact;
    try { contact = await base44.entities.Contact.create({ nom: form.nom, telephone: form.telephone, type: "acheteur", notes: "Via CTA bas de page" }); } catch {}
    await base44.entities.Lead.create({ contact_id: contact?.id || "", source: "landing_cta_bas", statut: "nouveau", notes: `Demande contact rapide — ${form.type}` });
    if (agency?.email) {
      await base44.integrations.Core.SendEmail({ to: agency.email, subject: `🔔 Lead bas de page — ${form.nom}`, body: `<p><strong>Nom :</strong> ${form.nom}<br><strong>Tél :</strong> ${form.telephone}<br><strong>Projet :</strong> ${form.type}</p>` });
    }
    setSent(true);
    setSending(false);
  };

  return (
    <section className="py-24 lg:py-32" id="contact-rapide">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="relative overflow-hidden bg-[#0F0F10] text-white rounded-3xl p-10 sm:p-16">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #4F46E5 0%, transparent 60%), radial-gradient(circle at 70% 50%, #818CF8 0%, transparent 60%)" }}
            />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Gauche : texte + actions */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                  Vous souhaitez vendre<br />ou acheter un bien ?
                </h2>
                <p className="mt-4 text-base text-white/60 max-w-sm">
                  Notre équipe est à votre écoute pour vous accompagner dans votre projet immobilier.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Link to="/contact">
                    <Button size="lg" className="rounded-full px-6 h-11 text-sm font-medium gap-2 bg-white text-black hover:bg-white/90">
                      Contacter l'agence <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/estimation">
                    <Button variant="outline" size="lg" className="rounded-full px-6 h-11 text-sm font-medium border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                      <TrendingUp className="w-4 h-4" /> Estimer mon bien
                    </Button>
                  </Link>
                </div>
                {agency?.phone && (
                  <a href={`tel:${agency.phone.replace(/\s/g,"")}`} className="mt-5 flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors w-fit">
                    <Phone className="w-4 h-4" /> Appel direct : {agency.phone}
                  </a>
                )}
              </div>

              {/* Droite : formulaire rapide */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <p className="font-semibold text-white mb-4 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4" /> Être rappelé rapidement
                </p>
                {sent ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                    <p className="font-bold text-green-300">Demande reçue !</p>
                    <p className="text-white/60 text-sm mt-1">Nous vous rappelons très rapidement.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                      placeholder="Votre nom *" className="h-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm" />
                    <Input type="tel" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                      placeholder="Téléphone *" className="h-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm" />
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white">
                      <option value="contact" className="text-black">Prise de contact</option>
                      <option value="achat" className="text-black">Projet d'achat</option>
                      <option value="vente" className="text-black">Projet de vente</option>
                      <option value="location" className="text-black">Location</option>
                      <option value="estimation" className="text-black">Estimation</option>
                    </select>
                    <Button className="w-full h-10 rounded-xl text-sm font-semibold gap-2" style={{ background: color }}
                      onClick={submit} disabled={sending || !form.nom || !form.telephone}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                      Me faire rappeler
                    </Button>
                    <p className="text-[10px] text-white/40 text-center">Sans engagement · Réponse sous 24h</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}