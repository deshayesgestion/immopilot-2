import { Link } from "react-router-dom";
import { Users, FolderOpen, TicketIcon, Clock, ArrowUpRight, Euro, PenSquare, AlertCircle, Bot } from "lucide-react";

const fmtRel = (d) => {
  if (!d) return "—";
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  if (diff < 60) return `il y a ${diff}min`;
  if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`;
  return `il y a ${Math.floor(diff / 1440)}j`;
};

const STATUT_COLORS = {
  nouveau: "bg-blue-100 text-blue-700",
  contacte: "bg-amber-100 text-amber-700",
  qualifie: "bg-green-100 text-green-700",
  perdu: "bg-red-100 text-red-700",
  en_cours: "bg-blue-100 text-blue-700",
  signe: "bg-green-100 text-green-700",
  termine: "bg-slate-100 text-slate-600",
  paye: "bg-green-100 text-green-700",
  en_retard: "bg-red-100 text-red-700",
  impaye: "bg-red-200 text-red-800",
  lead: "bg-slate-100 text-slate-600",
  offre: "bg-purple-100 text-purple-700",
  acte: "bg-emerald-100 text-emerald-700",
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

export default function CockpitActivite({ data }) {
  const items = [
    // Leads
    ...(data.leads || []).slice(0, 4).map(l => ({
      id: `lead-${l.id}`,
      icon: <Users className="w-3.5 h-3.5 text-purple-500" />,
      bg: "bg-purple-50",
      label: `Nouveau lead — ${data.contactMap?.[l.contact_id]?.nom || "Inconnu"}`,
      sub: data.bienMap?.[l.bien_id]?.titre || "Bien non précisé",
      statut: l.statut,
      date: l.created_date,
      link: "/admin/modules/vente",
    })),
    // Dossiers immobiliers
    ...(data.dossiers || []).slice(0, 3).map(d => ({
      id: `dossier-${d.id}`,
      icon: <FolderOpen className="w-3.5 h-3.5 text-blue-500" />,
      bg: "bg-blue-50",
      label: `Dossier — ${d.titre || "Sans titre"}`,
      sub: d.type === "vente" ? "Vente" : "Location",
      statut: d.statut,
      date: d.created_date,
      link: "/admin/dossiers",
    })),
    // Quittances récentes
    ...(data.quittances || []).slice(0, 4).map(q => ({
      id: `quittance-${q.id}`,
      icon: <Euro className="w-3.5 h-3.5 text-emerald-500" />,
      bg: "bg-emerald-50",
      label: `Paiement — ${q.locataire_nom || "—"}`,
      sub: `${q.bien_titre || "—"} · ${q.montant_total?.toLocaleString("fr-FR")} €`,
      statut: q.statut,
      date: q.created_date,
      link: "/admin/modules/location",
    })),
    // Acquéreurs (nouvelles étapes)
    ...(data.acquereurs || []).slice(0, 3).map(a => ({
      id: `acq-${a.id}`,
      icon: <PenSquare className="w-3.5 h-3.5 text-violet-500" />,
      bg: "bg-violet-50",
      label: `Acquéreur — ${a.nom}`,
      sub: `${a.localisation || "—"} · budget ${(a.budget_max||0).toLocaleString("fr-FR")} €`,
      statut: a.etape,
      date: a.created_date,
      link: "/admin/modules/vente",
    })),
    // Tickets
    ...(data.tickets || []).slice(0, 3).map(t => ({
      id: `ticket-${t.id}`,
      icon: <TicketIcon className="w-3.5 h-3.5 text-amber-500" />,
      bg: "bg-amber-50",
      label: `Ticket — ${t.appelant_nom || "Inconnu"}`,
      sub: t.resume_ia || t.type_demande || "À traiter",
      statut: t.statut,
      date: t.created_date,
      link: "/admin/parametres/accueil-ia",
    })),
    // Logs IA récents
    ...(data.logsIARecents || []).slice(0, 3).map(l => ({
      id: `log-${l.id}`,
      icon: <Bot className="w-3.5 h-3.5 text-primary" />,
      bg: "bg-primary/5",
      label: `IA — ${l.action_type || "Action"}`,
      sub: l.details || l.target_contact || l.agent || "—",
      statut: l.status,
      date: l.created_date,
      link: "/admin/securite",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Activité temps réel</p>
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucune activité récente</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Link key={item.id} to={item.link}
              className="flex items-center gap-3 hover:bg-secondary/20 rounded-xl px-2 py-2 transition-colors group">
              <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.sub}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.statut && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUT_COLORS[item.statut] || "bg-secondary text-muted-foreground"}`}>
                    {item.statut}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{fmtRel(item.date)}</span>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}