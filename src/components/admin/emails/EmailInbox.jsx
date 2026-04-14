import { useState } from "react";
import { Mail, Clock, CheckCircle2, AlertTriangle, Loader2, Bot, Home, TrendingUp, CreditCard, MessageSquare, Eye, Zap, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUT_CONFIG = {
  non_lu: { label: "Non lu", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  lu: { label: "Lu", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
  en_cours: { label: "En cours", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  traite: { label: "Traité", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  archive: { label: "Archivé", color: "bg-gray-100 text-gray-400", dot: "bg-gray-300" },
};

const PRIORITE_CONFIG = {
  urgent: { color: "text-red-600", bg: "bg-red-50 border-red-100", dot: "bg-red-500" },
  normal: { color: "text-amber-600", bg: "bg-white border-border/50", dot: "bg-amber-400" },
  faible: { color: "text-gray-400", bg: "bg-white border-border/30", dot: "bg-gray-300" },
};

const MODULE_ICONS = {
  location: <Home className="w-3 h-3 text-blue-500" />,
  vente: <TrendingUp className="w-3 h-3 text-purple-500" />,
  comptabilite: <CreditCard className="w-3 h-3 text-green-500" />,
  general: <MessageSquare className="w-3 h-3 text-gray-400" />,
};

const INTENTION_LABELS = {
  incident_logement: "Incident",
  demande_visite: "Demande visite",
  question_administrative: "Question admin",
  paiement_facture: "Paiement/Facture",
  demande_information: "Demande info",
  lead: "Lead",
  autre: "Autre",
};

const fmt = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  const now = new Date();
  const diffH = (now - date) / 3600000;
  if (diffH < 24) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export default function EmailInbox({ emails, selectedId, onSelect, onAnalyse, analysingId }) {
  const [filter, setFilter] = useState("all");

  const filtered = emails.filter(e => {
    if (filter === "non_lu") return e.statut === "non_lu";
    if (filter === "urgent") return e.priorite === "urgent";
    if (filter === "traite") return e.statut === "traite" || e.statut === "archive";
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex gap-1 p-2 border-b border-border/50">
        {[
          { id: "all", label: "Tous" },
          { id: "non_lu", label: "Non lus" },
          { id: "urgent", label: "Urgents" },
          { id: "traite", label: "Traités" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filter === f.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary/50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Aucun email</p>
          </div>
        ) : filtered.map(email => {
          const sc = STATUT_CONFIG[email.statut] || STATUT_CONFIG.lu;
          const pc = PRIORITE_CONFIG[email.priorite] || PRIORITE_CONFIG.normal;
          const isSelected = selectedId === email.id;
          return (
            <div key={email.id}
              onClick={() => onSelect(email)}
              className={`cursor-pointer px-4 py-3.5 transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-primary" : `hover:bg-secondary/20 border-l-2 border-transparent ${pc.bg}`}`}>
              <div className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sc.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm truncate ${email.statut === "non_lu" ? "font-semibold" : "font-medium text-foreground/80"}`}>
                      {email.de_nom || email.de}
                    </p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmt(email.date_reception)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${email.statut === "non_lu" ? "text-foreground/90" : "text-muted-foreground"}`}>
                    {email.objet}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {email.intention && (
                      <span className="text-[10px] bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {INTENTION_LABELS[email.intention]}
                      </span>
                    )}
                    {email.module && (
                      <span className="flex items-center gap-0.5 text-[10px] bg-secondary/40 px-1.5 py-0.5 rounded-full">
                        {MODULE_ICONS[email.module]}
                      </span>
                    )}
                    {email.ticket_id && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">🎫 Ticket</span>
                    )}
                    {email.priorite === "urgent" && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">URGENT</span>
                    )}
                  </div>
                </div>
              </div>
              {!email.resume_ia && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAnalyse(email.id); }}
                  disabled={analysingId === email.id}
                  className="mt-2 flex items-center gap-1 text-[10px] text-primary hover:underline">
                  {analysingId === email.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                  Analyser avec l'IA
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}