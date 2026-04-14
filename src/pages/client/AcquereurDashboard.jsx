import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Home, Eye, FileText, TrendingUp, Loader2, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function AcquereurDashboard() {
  const [user, setUser] = useState(null);
  const [acquereur, setAcquereur] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [acqs, txs] = await Promise.all([
        base44.entities.Acquereur.filter({ email: me.email }, "-created_date", 1),
        base44.entities.TransactionVente.filter({ acquereur_email: me.email }, "-created_date", 10),
      ]);
      setAcquereur(acqs[0] || null);
      setTransactions(txs);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const STEPS_LABELS = { prospection: "Prospection", visites: "Visites", offre: "Offre", verification: "Vérification", compromis: "Compromis", notaire: "Notaire", vendu: "Vendu" };
  const STEPS_ORDER = ["prospection", "visites", "offre", "verification", "compromis", "notaire", "vendu"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour {user?.full_name?.split(" ")[0] || "👋"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Votre espace acquéreur · suivi de votre projet immobilier</p>
      </div>

      {!acquereur && transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
          <Home className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold">Aucun dossier acquéreur</p>
          <p className="text-sm text-muted-foreground mt-1">Votre dossier sera créé par votre conseiller lors de votre premier contact.</p>
        </div>
      ) : (
        <>
          {/* Profile card */}
          {acquereur && (
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
              <p className="text-purple-100 text-xs uppercase tracking-wide mb-2">Votre profil acquéreur</p>
              <p className="text-xl font-bold">{acquereur.nom}</p>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-purple-200 text-xs">Budget max</p>
                  <p className="text-white font-bold">{fmt(acquereur.budget_max)}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs">Financement</p>
                  <p className="text-white font-bold">{acquereur.financement_valide ? "Validé ✓" : "En cours"}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs">Statut</p>
                  <p className="text-white font-bold capitalize">{acquereur.statut}</p>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          {transactions.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold">Mes transactions</p>
              {transactions.map((tx) => {
                const stepIdx = STEPS_ORDER.indexOf(tx.statut);
                const pct = Math.round(((stepIdx + 1) / STEPS_ORDER.length) * 100);
                return (
                  <div key={tx.id} className="bg-white rounded-2xl border border-border/50 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">{tx.property_title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Réf. {tx.reference}</p>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                        {STEPS_LABELS[tx.statut] || tx.statut}
                      </span>
                    </div>
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progression</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex gap-1 mt-2 overflow-x-auto">
                        {STEPS_ORDER.map((step, i) => (
                          <div key={step} className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full ${i < stepIdx ? "bg-green-100 text-green-700" : i === stepIdx ? "bg-purple-100 text-purple-700 font-semibold" : "bg-secondary text-muted-foreground"}`}>
                            {STEPS_LABELS[step]}
                          </div>
                        ))}
                      </div>
                    </div>
                    {tx.prix_affiche && (
                      <p className="text-sm font-bold mt-3">{fmt(tx.prix_affiche)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            <Link to="/espace/acquereur/visites" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all text-center">
              <Eye className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Mes visites</p>
            </Link>
            <Link to="/espace/acquereur/documents" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all text-center">
              <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Documents</p>
            </Link>
            <Link to="/espace/acquereur/messages" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all text-center">
              <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Recherche</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}