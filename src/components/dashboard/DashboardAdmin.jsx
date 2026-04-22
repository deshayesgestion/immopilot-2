import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Home, Users, Calendar, FileText, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CockpitKPIs from "./CockpitKPIs";
import CockpitAlertes from "./CockpitAlertes";
import CockpitPerformance from "./CockpitPerformance";
import CockpitActivite from "./CockpitActivite";
import CockpitBiens from "./CockpitBiens";
import CockpitInsightsIA from "./CockpitInsightsIA";

const quickActions = [
  { label: "Créer un bien", icon: Home, path: "/admin/modules/biens", color: "bg-blue-500" },
  { label: "Nouveau ticket", icon: FileText, path: "/admin/parametres/accueil-ia", color: "bg-amber-500" },
  { label: "Utilisateurs", icon: Users, path: "/admin/utilisateurs", color: "bg-purple-500" },
  { label: "Agenda", icon: Calendar, path: "/admin/agenda", color: "bg-green-500" },
];

export default function DashboardAdmin({ agency }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    const [
      biens,
      leads,
      contacts,
      transactions,
      paiements,
      tickets,
      dossiers,
    ] = await Promise.all([
      base44.entities.Bien.list("-created_date", 200),
      base44.entities.Lead.list("-created_date", 200),
      base44.entities.Contact.list("-created_date", 200),
      base44.entities.Transaction.list("-created_date", 200),
      base44.entities.Paiement.list("-created_date", 300),
      base44.entities.TicketIA.list("-created_date", 100),
      base44.entities.DossierImmobilier.list("-created_date", 200),
    ]);

    // Maps
    const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
    const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

    // ── BIENS ──
    const biensActifs = biens.filter(b => b.statut === "disponible" || b.statut === "en_cours");
    const biensVente = biens.filter(b => b.type === "vente").length;
    const biensLocation = biens.filter(b => b.type === "location").length;

    // ── TRANSACTIONS / VENTES ──
    const ventesEnCours = transactions.filter(t => t.statut === "en_cours" && t.type === "vente").length;
    const ventesSigne = transactions.filter(t => t.statut === "signe" && t.type === "vente").length;
    const ventesCloture = transactions.filter(t => t.statut === "cloture" && t.type === "vente").length;
    const locationsActives = transactions.filter(t => t.statut === "en_cours" && t.type === "location").length;

    // CA
    const caTotalTransactions = transactions
      .filter(t => ["signe", "cloture"].includes(t.statut))
      .reduce((s, t) => s + (t.prix || 0), 0);
    const caCommissions = transactions
      .filter(t => ["signe", "cloture"].includes(t.statut))
      .reduce((s, t) => s + (t.commission || 0), 0);
    const caVente = transactions
      .filter(t => t.type === "vente" && ["signe", "cloture"].includes(t.statut))
      .reduce((s, t) => s + (t.commission || t.prix || 0), 0);
    const caLocation = paiements
      .filter(p => p.type === "loyer" && p.statut === "paye")
      .reduce((s, p) => s + (p.montant || 0), 0);

    // ── PAIEMENTS ──
    const paiementsPayes = paiements.filter(p => p.statut === "paye");
    const paiementsEnAttente = paiements.filter(p => p.statut === "en_attente");
    const paiementsEnRetard = paiements.filter(p => p.statut === "en_retard");
    const montantEncaisse = paiementsPayes.reduce((s, p) => s + (p.montant || 0), 0);
    const montantAttente = paiementsEnAttente.reduce((s, p) => s + (p.montant || 0), 0);
    const montantRetard = paiementsEnRetard.reduce((s, p) => s + (p.montant || 0), 0);
    const loyersAttente = paiementsEnAttente.filter(p => p.type === "loyer").length;

    // Bénéfice estimé
    const beneficeEstime = montantEncaisse + caCommissions;
    const tauxMarge = montantEncaisse + caTotalTransactions > 0
      ? Math.round((beneficeEstime / (montantEncaisse + caTotalTransactions)) * 100)
      : 0;

    // ── LEADS / PERFORMANCE ──
    const totalLeads = leads.length;
    const leadsQualifies = leads.filter(l => l.statut === "qualifie" || l.statut === "contacte").length;

    // Durée moyenne dossier (en jours)
    const dossiersTermines = dossiers.filter(d => d.statut === "termine" || d.statut === "signe");
    const dureeTotaleDossiers = dossiersTermines.reduce((s, d) => {
      const debut = new Date(d.created_date);
      const fin = new Date(d.updated_date);
      return s + Math.max(0, Math.floor((fin - debut) / 86400000));
    }, 0);

    // ── ALERTES ──
    const ticketsUrgents = tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length;

    setData({
      // raw
      biens, leads, contacts, transactions, paiements, tickets, dossiers,
      contactMap, bienMap,
      // KPIs
      biensActifs: biensActifs.length, biensVente, biensLocation,
      ventesEnCours, ventesSigne, ventesCloture,
      locationsActives, loyersAttente,
      caTotalTransactions, caCommissions, caVente, caLocation,
      montantEncaisse, montantAttente, montantRetard,
      paiementsPayes: paiementsPayes.length,
      paiementsAttente: paiementsEnAttente.length,
      paiementsRetard: paiementsEnRetard.length,
      paiementsRetardList: paiementsEnRetard,
      beneficeEstime, tauxMarge,
      // Performance
      totalLeads, leadsQualifies,
      dossiersTermines: dossiersTermines.length,
      dureeTotaleDossiers,
      // Alertes
      ticketsUrgents,
    });

    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header cockpit */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Cockpit de pilotage
            {lastRefresh && <span> · Mis à jour {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full gap-2 h-8 text-xs" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <CockpitKPIs data={data || {}} loading={loading} />

      {/* IA Insights */}
      {!loading && data && <CockpitInsightsIA data={data} />}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a, i) => (
          <Link key={i} to={a.path}>
            <button className="w-full bg-white border border-border/50 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-sm transition-all group">
              <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-center">{a.label}</span>
            </button>
          </Link>
        ))}
      </div>

      {/* Alertes + Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {!loading && data && <CockpitAlertes data={data} />}
        {!loading && data && <CockpitActivite data={data} />}
      </div>

      {/* Performance + Biens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {!loading && data && <CockpitPerformance data={data} />}
        {!loading && data && <CockpitBiens data={data} />}
      </div>

      {/* Skeletons pendant le chargement */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-border/50 animate-pulse h-64" />
          ))}
        </div>
      )}
    </div>
  );
}