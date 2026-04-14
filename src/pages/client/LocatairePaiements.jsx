import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const STATUT_CONFIG = {
  paye: { label: "Payé", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  en_attente: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  en_retard: { label: "En retard", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

export default function LocatairePaiements() {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const dossiers = await base44.entities.DossierLocatif.list("-created_date", 100);
      const found = dossiers.find(d =>
        d.locataire_selectionne?.email === me.email ||
        d.candidatures?.some(c => c.email === me.email && c.statut === "selectionne")
      );
      setDossier(found || null);
      setLoading(false);
    };
    load();
  }, []);

  const simulerPaiement = async () => {
    if (!dossier) return;
    setPaying(true);
    const now = new Date().toISOString();
    const newPaiement = {
      id: Date.now(),
      montant: (dossier.loyer || 0) + (dossier.charges || 0),
      date: now,
      statut: "paye",
      mois: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      type: "loyer+charges",
    };
    const updated = [...(dossier.paiements || []), newPaiement];
    await base44.entities.DossierLocatif.update(dossier.id, { paiements: updated });
    setDossier(prev => ({ ...prev, paiements: updated }));
    setSuccessMsg("Paiement enregistré avec succès !");
    setPaying(false);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const paiements = [...(dossier?.paiements || [])].reverse();
  const total = (dossier?.loyer || 0) + (dossier?.charges || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes paiements</h1>
        <p className="text-sm text-muted-foreground mt-1">Historique et paiement de vos loyers</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Payer maintenant */}
      {dossier && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <p className="text-blue-100 text-xs uppercase tracking-wide mb-2">Prochain paiement</p>
          <p className="text-3xl font-bold">{fmt(total)}</p>
          <p className="text-blue-200 text-sm mt-1">Loyer {fmt(dossier.loyer)} + Charges {fmt(dossier.charges)}</p>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={simulerPaiement}
              disabled={paying}
              className="bg-white text-blue-700 hover:bg-white/90 rounded-full h-9 text-sm font-semibold gap-2"
            >
              {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              Payer maintenant
            </Button>
            <p className="text-blue-200 text-xs">Paiement sécurisé</p>
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <p className="text-sm font-semibold">Historique des paiements</p>
        </div>
        {paiements.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {paiements.map((p) => {
              const cfg = STATUT_CONFIG[p.statut] || STATUT_CONFIG.en_attente;
              const Icon = cfg.icon;
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${p.statut === "paye" ? "bg-green-50" : "bg-amber-50"}`}>
                    <Icon className={`w-4 h-4 ${p.statut === "paye" ? "text-green-600" : "text-amber-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{p.mois || fmtDate(p.date)}</p>
                    <p className="text-xs text-muted-foreground">{p.type || "Loyer"} · {fmtDate(p.date)}</p>
                  </div>
                  <p className="text-sm font-bold">{fmt(p.montant)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}