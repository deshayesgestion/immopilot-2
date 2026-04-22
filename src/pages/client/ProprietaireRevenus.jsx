import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, TrendingUp, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function ProprietaireRevenus() {
  const [paiements, setPaiements] = useState([]);
  const [dossiersPaies, setDossiersPaies] = useState([]); // fallback ancien système
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();

      const [contacts, props] = await Promise.all([
        base44.entities.Contact.filter({ email: me.email }, "-created_date", 5),
        base44.entities.Property.filter({ owner_email: me.email }, "-created_date", 50),
      ]);

      const myContact = contacts[0] || null;

      // Paiements entité Paiement liés au contact propriétaire
      let paies = [];
      if (myContact) {
        paies = await base44.entities.Paiement.filter({ contact_id: myContact.id }, "-created_date", 200);
      }

      // Fallback: DossierLocatif lié aux propriétés du portail
      const propIds = new Set(props.map(p => p.id));
      let dossFallback = [];
      if (propIds.size > 0) {
        const dossiers = await base44.entities.DossierLocatif.list("-created_date", 100);
        dossFallback = dossiers.filter(d => propIds.has(d.property_id));
      }

      setPaiements(paies);
      setDossiersPaies(dossFallback);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  // Paiements entité (source principale)
  const loyersEntite = paiements.filter(p => p.type === "loyer");
  const commissionsEntite = paiements.filter(p => p.type === "commission");

  // Fallback dossiers locatifs (ancienne source)
  const loyersDossier = dossiersPaies.flatMap(d =>
    (d.paiements || []).map(p => ({ ...p, bien: d.property_title, source: "dossier" }))
  );

  const allLoyersAffiches = loyersEntite.length > 0 ? loyersEntite : loyersDossier;

  const totalRecu = allLoyersAffiches.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);
  const totalEnAttente = allLoyersAffiches.filter(p => p.statut === "en_attente").reduce((s, p) => s + (p.montant || 0), 0);
  const totalLoyer = dossiersPaies.reduce((s, d) => s + (d.loyer || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenus locatifs</h1>
        <p className="text-sm text-muted-foreground mt-1">Suivi de vos encaissements</p>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white">
          <p className="text-emerald-100 text-xs mb-1">Total encaissé</p>
          <p className="text-2xl font-bold">{fmt(totalRecu)}</p>
          <p className="text-emerald-200 text-xs mt-1">{allLoyersAffiches.filter(p => p.statut === "paye").length} paiements</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <p className="text-xs text-muted-foreground mb-1">En attente</p>
          <p className="text-2xl font-bold text-amber-500">{fmt(totalEnAttente)}</p>
          <p className="text-xs text-muted-foreground mt-1">{allLoyersAffiches.filter(p => p.statut === "en_attente").length} paiements</p>
        </div>
      </div>

      {totalLoyer > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Revenus mensuels estimés</p>
          <p className="text-xl font-bold text-blue-700">{fmt(totalLoyer)}/mois</p>
          <p className="text-xs text-muted-foreground mt-0.5">sur {dossiersPaies.length} bien{dossiersPaies.length > 1 ? "s" : ""} en location</p>
        </div>
      )}

      {/* Commissions (si existantes) */}
      {commissionsEntite.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Commissions
            </p>
          </div>
          <div className="divide-y divide-border/30">
            {commissionsEntite.map((p, i) => (
              <div key={p.id || i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Commission</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(p.date_paiement || p.date_echeance)}</p>
                </div>
                <p className="text-sm font-bold">{fmt(p.montant)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.statut === "paye" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {p.statut === "paye" ? "Reçu" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique des loyers */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <p className="text-sm font-semibold">Historique des loyers</p>
        </div>
        {allLoyersAffiches.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {[...allLoyersAffiches].sort((a, b) => new Date(b.date_paiement || b.date_echeance || b.date || 0) - new Date(a.date_paiement || a.date_echeance || a.date || 0)).map((p, i) => {
              const dateLabel = fmtDate(p.date_paiement || p.date_echeance || p.date);
              const moisLabel = p.mois || (p.date_echeance ? new Date(p.date_echeance).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : null);
              return (
                <div key={p.id || i} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${p.statut === "paye" ? "bg-green-50" : "bg-amber-50"}`}>
                    {p.statut === "paye"
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <Clock className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.bien || moisLabel || "Loyer"}</p>
                    <p className="text-xs text-muted-foreground">{moisLabel || dateLabel}</p>
                  </div>
                  <p className="text-sm font-bold">{fmt(p.montant)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.statut === "paye" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {p.statut === "paye" ? "Reçu" : "En attente"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}