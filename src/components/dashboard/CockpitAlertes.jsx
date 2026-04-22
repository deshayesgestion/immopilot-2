import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Home, TicketIcon, ChevronRight, CheckCircle2 } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function CockpitAlertes({ data }) {
  const alertes = [];

  // Paiements en retard
  (data.paiementsRetardList || []).slice(0, 3).forEach(p => {
    alertes.push({
      type: "retard_paiement",
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      bg: "bg-red-50 border-red-200",
      dot: "bg-red-500",
      label: "Paiement en retard",
      detail: `${fmt(p.montant)} — échéance ${fmtDate(p.date_echeance)}`,
      link: "/admin/modules/comptabilite",
    });
  });

  // Dossiers inactifs (pas d'update depuis 15j)
  const quinzeJours = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  (data.dossiers || []).filter(d => new Date(d.updated_date) < quinzeJours && d.statut === "en_cours").slice(0, 3).forEach(d => {
    const jours = Math.floor((Date.now() - new Date(d.updated_date)) / 86400000);
    alertes.push({
      type: "dossier_inactif",
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      bg: "bg-amber-50 border-amber-200",
      dot: "bg-amber-500",
      label: "Dossier inactif",
      detail: `${d.titre || d.reference || "Dossier"} — ${jours}j sans activité`,
      link: "/admin/dossiers",
    });
  });

  // Biens sans activité (aucun lead depuis 30j)
  const trenteJours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  (data.biens || []).filter(b => b.statut === "disponible" && new Date(b.updated_date) < trenteJours).slice(0, 2).forEach(b => {
    alertes.push({
      type: "bien_inactif",
      icon: <Home className="w-4 h-4 text-blue-500" />,
      bg: "bg-blue-50 border-blue-200",
      dot: "bg-blue-400",
      label: "Bien sans activité",
      detail: `${b.titre} — disponible depuis +30j`,
      link: "/admin/modules/biens",
    });
  });

  // Tickets urgents
  (data.tickets || []).filter(t => t.priorite === "urgent" && t.statut !== "resolu").slice(0, 3).forEach(t => {
    alertes.push({
      type: "ticket_urgent",
      icon: <TicketIcon className="w-4 h-4 text-orange-500" />,
      bg: "bg-orange-50 border-orange-200",
      dot: "bg-orange-500",
      label: "Ticket urgent",
      detail: `${t.appelant_nom || "Inconnu"} — ${t.resume_ia || t.type_demande || "À traiter"}`,
      link: "/admin/parametres/accueil-ia",
    });
  });

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold">Alertes intelligentes</p>
          {alertes.length > 0 && (
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{alertes.length}</span>
          )}
        </div>
      </div>

      {alertes.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <p className="text-sm text-muted-foreground">Tout est en ordre — aucune alerte</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alertes.map((a, i) => (
            <Link key={i} to={a.link}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm ${a.bg}`}>
              <div className="flex-shrink-0">{a.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{a.label}</p>
                <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}