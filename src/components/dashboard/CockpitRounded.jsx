import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Phone, Ticket, CalendarClock, ChevronRight, Loader2, ArrowUpRight, PhoneIncoming, PhoneMissed, CheckCircle2 } from "lucide-react";

const PRIORITE_COLORS = {
  urgent:  "bg-red-100 text-red-700 border-red-200",
  normal:  "bg-amber-100 text-amber-700 border-amber-200",
  faible:  "bg-slate-100 text-slate-600 border-slate-200",
};

const TYPE_COLORS = {
  vente:       "bg-blue-100 text-blue-700",
  location:    "bg-emerald-100 text-emerald-700",
  compta:      "bg-violet-100 text-violet-700",
  support:     "bg-orange-100 text-orange-700",
  inconnu:     "bg-slate-100 text-slate-600",
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function CockpitRounded({ tickets }) {
  // tickets est passé depuis le dashboard (TicketIA créés par Rounded via appel entrant)
  const roundedTickets = (tickets || [])
    .filter(t => t.agent === "rounded" || t.source === "rounded" || t.canal === "appel")
    .slice(0, 10);

  const stats = {
    total: roundedTickets.length,
    urgents: roundedTickets.filter(t => t.priorite === "urgent").length,
    resolus: roundedTickets.filter(t => t.statut === "resolu").length,
    enCours: roundedTickets.filter(t => t.statut !== "resolu" && t.statut !== "ferme").length,
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
            <Phone className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-bold">📞 Rounded — Communication</p>
            <p className="text-[11px] text-muted-foreground">Appels entrants · Tickets CRM · RDV générés · Transcriptions</p>
          </div>
        </div>
        <Link to="/admin/parametres/accueil-ia"
          className="text-[11px] text-primary hover:underline flex items-center gap-1">
          Gérer <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Appels reçus",  value: stats.total,   icon: <PhoneIncoming className="w-3.5 h-3.5 text-sky-500" />,   bg: "bg-sky-50" },
          { label: "En attente",    value: stats.enCours, icon: <Ticket className="w-3.5 h-3.5 text-amber-500" />,         bg: "bg-amber-50" },
          { label: "Urgents",       value: stats.urgents, icon: <PhoneMissed className="w-3.5 h-3.5 text-red-500" />,      bg: "bg-red-50" },
          { label: "Résolus",       value: stats.resolus, icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,   bg: "bg-green-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl ${s.bg} px-3 py-2 text-center`}>
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-base font-bold">{s.value}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rôle strict — bandeau informatif */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
        <p className="text-[11px] text-sky-700 font-semibold mb-1">Rôle Rounded dans le SaaS :</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {[
            "📥 Réception appels entrants",
            "🎫 Création tickets CRM automatique",
            "📝 Transcription des appels",
            "📅 Prise de RDV",
            "🔗 Redirection vers modules SaaS",
          ].map(r => (
            <span key={r} className="text-[10px] text-sky-600">{r}</span>
          ))}
        </div>
      </div>

      {/* Tickets récents créés par Rounded */}
      {roundedTickets.length === 0 ? (
        <div className="text-center py-6">
          <Phone className="w-8 h-8 text-muted-foreground/15 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Aucun appel Rounded récent</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">Les appels entrants généreront automatiquement des tickets ici</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tickets créés par Rounded</p>
          {roundedTickets.map(t => (
            <Link key={t.id} to="/admin/parametres/accueil-ia"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 hover:border-sky-200 hover:bg-sky-50/30 transition-all group">
              <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-xs font-semibold truncate">{t.appelant_nom || t.contact_nom || "Appelant inconnu"}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[t.type_demande] || TYPE_COLORS.inconnu}`}>
                    {t.type_demande || "inconnu"}
                  </span>
                  {t.priorite && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium border ${PRIORITE_COLORS[t.priorite] || PRIORITE_COLORS.faible}`}>
                      {t.priorite}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{t.resume_ia || t.objet || "Appel entrant"}</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">{fmtDate(t.created_date)}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-sky-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Séparateur architecture */}
      <div className="border-t border-border/30 pt-3">
        <p className="text-[10px] text-muted-foreground text-center">
          ⚠️ Rounded = interface téléphonique uniquement · L'analyse métier est gérée par le <span className="font-semibold text-primary">Super Agent IA</span>
        </p>
      </div>
    </div>
  );
}