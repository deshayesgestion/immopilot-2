import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, CheckCircle2, Phone, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Popup intelligente : déclenchée après 12s OU scroll 50%
export default function LeadPopup({ agency }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [tab, setTab] = useState("rappel"); // rappel | estimation
  const [form, setForm] = useState({ nom: "", telephone: "", email: "", type: "vente" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("popup_dismissed")) return;

    // Déclencheur 1 : timer 12s
    const timer = setTimeout(() => { if (!dismissed) setVisible(true); }, 12000);

    // Déclencheur 2 : scroll 50%
    const onScroll = () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (pct >= 0.5 && !dismissed) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => { clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
  }, [dismissed]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("popup_dismissed", "1");
  };

  const submit = async () => {
    if (!form.nom || !form.telephone) return;
    setSending(true);
    // Créer lead + contact
    let contact;
    try {
      contact = await base44.entities.Contact.create({
        nom: form.nom, telephone: form.telephone, email: form.email || "",
        type: tab === "rappel" ? "acheteur" : "vendeur", notes: `Via popup landing — ${tab}`
      });
    } catch {}
    await base44.entities.Lead.create({
      contact_id: contact?.id || "",
      source: "landing_popup",
      statut: "nouveau",
      notes: `Demande ${tab === "rappel" ? "de rappel" : "d'estimation"} — ${form.type}`,
    });
    // Notif agence
    if (agency?.email) {
      await base44.integrations.Core.SendEmail({
        to: agency.email,
        subject: `🔔 Nouveau lead — ${tab === "rappel" ? "Demande de rappel" : "Estimation"} — ${form.nom}`,
        body: `<p><strong>Nom :</strong> ${form.nom}<br><strong>Tél :</strong> ${form.telephone}<br><strong>Email :</strong> ${form.email || "—"}<br><strong>Type :</strong> ${form.type}<br><strong>Source :</strong> Popup landing</p>`
      });
    }
    setSent(true);
    setSending(false);
    setTimeout(dismiss, 3000);
  };

  if (!visible) return null;

  const color = agency?.primary_color || "#4F46E5";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header coloré */}
        <div style={{ background: color }} className="px-5 py-4 relative">
          <button onClick={dismiss} className="absolute top-3 right-3 text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-xs font-semibold uppercase tracking-wide">Offre exclusive</span>
          </div>
          <p className="text-white font-bold text-lg leading-snug">Estimation gratuite<br />ou rappel sous 24h</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 bg-slate-50 border-b">
          {[
            { id: "rappel", label: "📞 Être rappelé", icon: Phone },
            { id: "estimation", label: "📊 Estimer", icon: TrendingUp },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${tab === t.id ? "text-white shadow-sm" : "text-muted-foreground hover:bg-white"}`}
              style={tab === t.id ? { background: color } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {sent ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-green-800">Demande envoyée !</p>
            <p className="text-xs text-muted-foreground mt-1">Nous vous recontactons très rapidement.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
              placeholder="Votre nom *" className="h-10 rounded-xl text-sm" />
            <Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
              placeholder="Téléphone *" type="tel" className="h-10 rounded-xl text-sm" />
            {tab === "estimation" && (
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full h-10 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="vente">Je veux vendre</option>
                <option value="location">Je veux mettre en location</option>
              </select>
            )}
            <Button className="w-full rounded-xl h-10 text-sm font-semibold gap-2" style={{ background: color }}
              onClick={submit} disabled={sending || !form.nom || !form.telephone}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {tab === "rappel" ? "Je veux être rappelé" : "Obtenir mon estimation"}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">Sans engagement · Gratuit · Réponse sous 24h</p>
          </div>
        )}
      </div>
    </div>
  );
}