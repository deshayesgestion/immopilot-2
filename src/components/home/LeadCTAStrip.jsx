import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, TrendingUp, CalendarCheck, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Bande CTA sticky au milieu de la page — 3 actions rapides
export default function LeadCTAStrip({ agency }) {
  const [activeForm, setActiveForm] = useState(null); // null | "rappel" | "visite" | "estimation"
  const [form, setForm] = useState({ nom: "", telephone: "", email: "", type: "vente", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const color = agency?.primary_color || "#4F46E5";

  const submit = async () => {
    if (!form.nom || !form.telephone) return;
    setSending(true);
    let contact;
    try {
      contact = await base44.entities.Contact.create({
        nom: form.nom, telephone: form.telephone, email: form.email || "",
        type: activeForm === "estimation" ? "vendeur" : "acheteur",
        notes: `Via CTA landing — ${activeForm}`
      });
    } catch {}
    await base44.entities.Lead.create({
      contact_id: contact?.id || "",
      source: `landing_cta_${activeForm}`,
      statut: "nouveau",
      notes: `Demande : ${activeForm} — ${form.type} — ${form.message || ""}`,
    });
    // Scoring IA asynchrone
    base44.integrations.Core.InvokeLLM({
      prompt: `Score lead immobilier 0-100 : ${form.nom}, tél : ${form.telephone}, demande : ${activeForm}, type : ${form.type}. Retourne JSON {score:number, priorite:string, commentaire:string}`,
      response_json_schema: { type: "object", properties: { score: { type: "number" }, priorite: { type: "string" }, commentaire: { type: "string" } } }
    }).then(async r => {
      if (r?.score !== undefined && contact?.id) {
        const l = await base44.entities.Lead.filter({ contact_id: contact.id });
        if (l[0]) await base44.entities.Lead.update(l[0].id, { score: r.score, notes: `${l[0].notes || ""} | Score IA: ${r.score}/100 — ${r.commentaire}` });
      }
    }).catch(() => {});
    // Notif
    if (agency?.email) {
      await base44.integrations.Core.SendEmail({
        to: agency.email,
        subject: `🔔 Lead ${activeForm} — ${form.nom} — ${form.telephone}`,
        body: `<p><strong>Action :</strong> ${activeForm}<br><strong>Nom :</strong> ${form.nom}<br><strong>Tél :</strong> ${form.telephone}<br><strong>Email :</strong> ${form.email || "—"}<br><strong>Type :</strong> ${form.type}<br><strong>Message :</strong> ${form.message || "—"}</p>`
      });
    }
    setSent(true);
    setSending(false);
    setTimeout(() => { setSent(false); setActiveForm(null); setForm({ nom: "", telephone: "", email: "", type: "vente", message: "" }); }, 3000);
  };

  const ACTIONS = [
    { id: "visite", label: "Demander une visite", icon: CalendarCheck, desc: "Planifiez une visite sous 24h" },
    { id: "estimation", label: "Estimer mon bien", icon: TrendingUp, desc: "Estimation gratuite & rapide" },
    { id: "rappel", label: "Être rappelé", icon: Phone, desc: "Un agent vous rappelle vite" },
  ];

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Titre */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Votre projet immobilier</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Comment pouvons-nous vous aider ?</h2>
        </div>

        {/* 3 actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {ACTIONS.map(a => {
            const Icon = a.icon;
            const isActive = activeForm === a.id;
            return (
              <button key={a.id} onClick={() => setActiveForm(isActive ? null : a.id)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-center cursor-pointer ${
                  isActive ? "border-transparent text-white shadow-lg scale-105" : "bg-white border-border/50 hover:border-primary/30 hover:shadow-sm"
                }`}
                style={isActive ? { background: color } : {}}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? "bg-white/20" : "bg-primary/10"}`}>
                  <Icon className={`w-6 h-6 ${isActive ? "text-white" : "text-primary"}`} style={isActive ? {} : { color }} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${isActive ? "text-white" : "text-foreground"}`}>{a.label}</p>
                  <p className={`text-xs mt-0.5 ${isActive ? "text-white/80" : "text-muted-foreground"}`}>{a.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Formulaire contextuel */}
        {activeForm && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 max-w-lg mx-auto animate-fade-up">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-800 text-lg">Demande envoyée !</p>
                <p className="text-sm text-muted-foreground mt-1">Nous vous recontactons très rapidement.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-semibold text-sm mb-1">
                  {activeForm === "visite" && "📅 Demander une visite"}
                  {activeForm === "estimation" && "📊 Estimation gratuite"}
                  {activeForm === "rappel" && "📞 Être rappelé rapidement"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Votre nom *" className="h-10 rounded-xl text-sm" />
                  <Input type="tel" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                    placeholder="Téléphone *" className="h-10 rounded-xl text-sm" />
                </div>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="Email (optionnel)" className="h-10 rounded-xl text-sm" />
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-input bg-white px-3 text-sm">
                  <option value="vente">Achat / Vente</option>
                  <option value="location">Location</option>
                  <option value="estimation">Estimation uniquement</option>
                </select>
                {activeForm === "visite" && (
                  <Input value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Référence du bien ou adresse (optionnel)" className="h-10 rounded-xl text-sm" />
                )}
                <Button className="w-full h-11 rounded-xl text-sm font-semibold gap-2"
                  style={{ background: color }}
                  onClick={submit} disabled={sending || !form.nom || !form.telephone}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Envoyer ma demande
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">Sans engagement · Gratuit · Confidentiel</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}