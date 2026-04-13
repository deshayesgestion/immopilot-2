import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, Euro, TrendingUp, ArrowRight } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function AdminVenteCloture() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.TransactionVente.filter({ statut: "vendu" }, "-updated_date", 100)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  const totalCA = transactions.reduce((s, t) => s + (t.prix_vente_final || 0), 0);
  const totalCommissions = transactions.reduce((s, t) => s + (t.commission_agence || 0), 0);
  const delaiMoyen = transactions.length > 0
    ? Math.round(transactions.filter((t) => t.created_date && t.date_acte_signe).reduce((s, t) => {
        const days = (new Date(t.date_acte_signe) - new Date(t.created_date)) / (1000 * 60 * 60 * 24);
        return s + (isNaN(days) ? 0 : days);
      }, 0) / transactions.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clôtures</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ventes finalisées</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold text-green-600">{transactions.length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Ventes finalisées</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-primary">{fmt(totalCA)}</p>
          <p className="text-sm text-muted-foreground mt-0.5">CA total</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-amber-600">{fmt(totalCommissions)}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Commissions</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold">{delaiMoyen > 0 ? `${delaiMoyen}j` : "—"}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Délai moyen</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-16">
          <CheckCircle2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium">Aucune vente finalisée</p>
          <p className="text-xs text-muted-foreground mt-1">Les ventes clôturées apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <p className="text-sm font-semibold">{transactions.length} vente{transactions.length > 1 ? "s" : ""} finalisée{transactions.length > 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-border/30">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.property_title}</p>
                  <p className="text-xs text-muted-foreground">{t.acquereur_nom} · Acte signé le {fmtDate(t.date_acte_signe)}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div>
                    <p className="text-sm font-bold">{fmt(t.prix_vente_final)}</p>
                    <p className="text-xs text-green-600">Comm. : {fmt(t.commission_agence)}</p>
                  </div>
                  <Link to={`/admin/vente/transactions/${t.id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 bg-secondary/20 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Total commissions agence</p>
            <p className="text-sm font-bold text-amber-600">{fmt(totalCommissions)}</p>
          </div>
        </div>
      )}
    </div>
  );
}