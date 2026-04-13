import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock, AlertTriangle, Euro, RefreshCw } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const STATUT_CONFIG = {
  paye: { label: "Payé", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  en_attente: { label: "En attente", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  en_retard: { label: "En retard", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  annule: { label: "Annulé", icon: Euro, color: "text-gray-500", bg: "bg-gray-50" },
};

export default function HistoriquePaiements({ dossierId, dossierType = "location", onPaymentUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [relances, setRelances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const [txs, rels] = await Promise.all([
      base44.entities.Transaction.filter({ dossier_id: dossierId }, "-date_echeance", 50),
      base44.entities.Relance.list("-created_date", 50),
    ]);
    setTransactions(txs);
    setRelances(rels.filter(r => txs.some(t => t.id === r.transaction_id)));
    setLoading(false);
  };

  useEffect(() => { if (dossierId) load(); }, [dossierId]);

  const marquerPaye = async (tx) => {
    setMarking(tx.id);
    await base44.entities.Transaction.update(tx.id, {
      statut: "paye",
      date_paiement: new Date().toISOString().substring(0, 10),
    });
    // Mettre à jour les relances liées
    const relancesLiees = relances.filter(r => r.transaction_id === tx.id && r.statut !== "resolue");
    for (const r of relancesLiees) {
      await base44.entities.Relance.update(r.id, { statut: "resolue" });
    }
    setMarking(null);
    load();
    if (onPaymentUpdate) onPaymentUpdate();
  };

  const syncMensuel = async () => {
    setSyncing(true);
    await base44.functions.invoke("syncLoyers", {});
    setSyncing(false);
    load();
  };

  const stats = {
    total: transactions.reduce((s, t) => s + (t.montant || 0), 0),
    paye: transactions.filter(t => t.statut === "paye").reduce((s, t) => s + (t.montant || 0), 0),
    impayes: transactions.filter(t => t.statut === "en_retard").reduce((s, t) => s + (t.montant || 0), 0),
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats résumé */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-green-600">{fmt(stats.paye)}</p>
          <p className="text-xs text-muted-foreground">Perçu</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-amber-600">{fmt(stats.total - stats.paye - stats.impayes)}</p>
          <p className="text-xs text-muted-foreground">En attente</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-red-600">{fmt(stats.impayes)}</p>
          <p className="text-xs text-muted-foreground">Impayés</p>
        </div>
      </div>

      {dossierType === "location" && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={syncMensuel} disabled={syncing}>
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Synchroniser loyers
          </Button>
        </div>
      )}

      {/* Liste transactions */}
      {transactions.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">Aucun paiement enregistré dans la comptabilité.</p>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => {
            const config = STATUT_CONFIG[tx.statut] || STATUT_CONFIG.en_attente;
            const Icon = config.icon;
            const txRelances = relances.filter(r => r.transaction_id === tx.id);
            return (
              <div key={tx.id} className={`rounded-xl border border-border/40 overflow-hidden`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tx.reference || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Échéance {fmtDate(tx.date_echeance)}
                      {tx.date_paiement ? ` · Payé le ${fmtDate(tx.date_paiement)}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0">{fmt(tx.montant)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                  {(tx.statut === "en_attente" || tx.statut === "en_retard") && (
                    <Button
                      size="sm"
                      className="h-7 text-xs rounded-full bg-green-600 hover:bg-green-700 flex-shrink-0"
                      onClick={() => marquerPaye(tx)}
                      disabled={marking === tx.id}
                    >
                      {marking === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Marquer payé"}
                    </Button>
                  )}
                </div>
                {txRelances.length > 0 && (
                  <div className="px-4 pb-3 space-y-1">
                    {txRelances.map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/20 rounded-lg px-3 py-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.statut === "resolue" ? "bg-green-500" : r.statut === "envoyee" ? "bg-blue-500" : "bg-amber-500"}`} />
                        Relance niv.{r.niveau} — {r.statut === "resolue" ? "Résolue" : r.statut === "envoyee" ? `Envoyée le ${fmtDate(r.date_envoi)}` : "Planifiée"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}