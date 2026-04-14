import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, TrendingUp, Loader2, CheckCircle2, Clock } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function ProprietaireRevenus() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const props = await base44.entities.Property.filter({ owner_email: me.email }, "-created_date", 50);
      const dos = await base44.entities.DossierLocatif.list("-created_date", 100);
      setDossiers(dos.filter(d => props.some(p => p.id === d.property_id)));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const allPaiements = dossiers.flatMap(d =>
    (d.paiements || []).map(p => ({ ...p, property: d.property_title }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalRecu = allPaiements.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);
  const totalLoyer = dossiers.reduce((s, d) => s + (d.loyer || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenus locatifs</h1>
        <p className="text-sm text-muted-foreground mt-1">Suivi de vos encaissements</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white">
          <p className="text-emerald-100 text-xs mb-1">Revenus mensuels</p>
          <p className="text-2xl font-bold">{fmt(totalLoyer)}</p>
          <p className="text-emerald-200 text-xs mt-1">sur {dossiers.length} bien{dossiers.length > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <p className="text-xs text-muted-foreground mb-1">Total encaissé</p>
          <p className="text-2xl font-bold text-emerald-600">{fmt(totalRecu)}</p>
          <p className="text-xs text-muted-foreground mt-1">{allPaiements.filter(p => p.statut === "paye").length} paiements</p>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <p className="text-sm font-semibold">Historique des encaissements</p>
        </div>
        {allPaiements.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {allPaiements.map((p, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${p.statut === "paye" ? "bg-green-50" : "bg-amber-50"}`}>
                  {p.statut === "paye" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.property}</p>
                  <p className="text-xs text-muted-foreground">{p.mois || fmtDate(p.date)}</p>
                </div>
                <p className="text-sm font-bold">{fmt(p.montant)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.statut === "paye" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {p.statut === "paye" ? "Reçu" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}