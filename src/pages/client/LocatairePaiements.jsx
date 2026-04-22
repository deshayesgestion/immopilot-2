import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Loader2, Home } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const STATUT_CONFIG = {
  paye:        { label: "Payé",       color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  en_attente:  { label: "En attente", color: "bg-amber-100 text-amber-700",  icon: Clock },
  en_retard:   { label: "En retard",  color: "bg-red-100 text-red-700",      icon: AlertTriangle },
};

export default function LocatairePaiements() {
  const [paiements, setPaiements] = useState([]);
  const [dossierLocatif, setDossierLocatif] = useState(null);
  const [loyer, setLoyer] = useState(0);
  const [charges, setCharges] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();

      // 1. Chercher le contact
      const contacts = await base44.entities.Contact.filter({ email: me.email }, "-created_date", 5);
      const myContact = contacts[0] || null;

      // 2. Paiements liés au contact (entité Paiement)
      let paies = [];
      if (myContact) {
        paies = await base44.entities.Paiement.filter({ contact_id: myContact.id, type: "loyer" }, "-created_date", 100);
      }

      // 3. Fallback: DossierLocatif
      const dossiers = await base44.entities.DossierLocatif.list("-created_date", 100);
      const dLocatif = dossiers.find(d =>
        d.locataire_selectionne?.email === me.email ||
        d.candidatures?.some(c => c.email === me.email && c.statut === "selectionne")
      ) || null;
      setDossierLocatif(dLocatif);

      // Fusionner les paiements (entité Paiement en priorité, fallback DossierLocatif)
      if (paies.length > 0) {
        setPaiements(paies);
      } else if (dLocatif?.paiements?.length > 0) {
        // Adapter l'ancien format
        setPaiements(dLocatif.paiements.map(p => ({
          ...p,
          montant: p.montant,
          statut: p.statut || "paye",
          date_echeance: p.date,
          date_paiement: p.statut === "paye" ? p.date : null,
          type: "loyer",
        })));
      }

      setLoyer(dLocatif?.loyer || 0);
      setCharges(dLocatif?.charges || 0);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const total = loyer + charges;
  const enRetard = paiements.some(p => p.statut === "en_retard");
  const totalPaye = paiements.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes paiements</h1>
        <p className="text-sm text-muted-foreground mt-1">Historique de vos loyers</p>
      </div>

      {/* Résumé */}
      {total > 0 && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <p className="text-blue-100 text-xs uppercase tracking-wide mb-2">Loyer mensuel</p>
          <p className="text-3xl font-bold">{fmt(total)}</p>
          <p className="text-blue-200 text-sm mt-1">
            Loyer {fmt(loyer)} {charges > 0 ? `+ Charges ${fmt(charges)}` : ""}
          </p>
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${enRetard ? "bg-red-400 text-white" : "bg-green-400 text-white"}`}>
            {enRetard ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {enRetard ? "Retard de paiement" : "Paiements à jour"}
          </div>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-border/50 p-4 text-center">
          <p className="text-lg font-bold text-green-600">{paiements.filter(p => p.statut === "paye").length}</p>
          <p className="text-xs text-muted-foreground">Payés</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 p-4 text-center">
          <p className="text-lg font-bold text-amber-500">{paiements.filter(p => p.statut === "en_attente").length}</p>
          <p className="text-xs text-muted-foreground">En attente</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 p-4 text-center">
          <p className="text-lg font-bold text-red-500">{paiements.filter(p => p.statut === "en_retard").length}</p>
          <p className="text-xs text-muted-foreground">En retard</p>
        </div>
      </div>

      {/* Total encaissé */}
      {totalPaye > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Total payé</p>
            <p className="text-xl font-bold text-green-700 mt-0.5">{fmt(totalPaye)}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-green-500/30" />
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
            {[...paiements].reverse().map((p, i) => {
              const cfg = STATUT_CONFIG[p.statut] || STATUT_CONFIG.en_attente;
              const Icon = cfg.icon;
              const dateLabel = p.date_paiement ? fmtDate(p.date_paiement) : fmtDate(p.date_echeance);
              const moisLabel = p.mois || (p.date_echeance ? new Date(p.date_echeance).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : null);
              return (
                <div key={p.id || i} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${p.statut === "paye" ? "bg-green-50" : p.statut === "en_retard" ? "bg-red-50" : "bg-amber-50"}`}>
                    <Icon className={`w-4 h-4 ${p.statut === "paye" ? "text-green-600" : p.statut === "en_retard" ? "text-red-500" : "text-amber-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{moisLabel || "Loyer"}</p>
                    <p className="text-xs text-muted-foreground">{p.type === "loyer" ? "Loyer" : p.type || "Paiement"} · {dateLabel}</p>
                  </div>
                  <p className="text-sm font-bold">{fmt(p.montant)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}