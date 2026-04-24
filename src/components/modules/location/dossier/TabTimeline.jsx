import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock, Plus, FolderOpen, User, FileText, Calendar, CheckCircle2,
  Euro, AlertTriangle, Key, LogOut, Edit3, Sparkles, MessageSquare, Shield
} from "lucide-react";

const fmtDT = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtFull = iso => iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const EVENT_ICONS = {
  candidat:    { icon: User,          color: "bg-blue-100 text-blue-600",     dot: "bg-blue-400" },
  document:    { icon: FileText,      color: "bg-indigo-100 text-indigo-600", dot: "bg-indigo-400" },
  rdv:         { icon: Calendar,      color: "bg-purple-100 text-purple-600", dot: "bg-purple-400" },
  selection:   { icon: CheckCircle2,  color: "bg-green-100 text-green-600",   dot: "bg-green-500" },
  bail:        { icon: Edit3,         color: "bg-amber-100 text-amber-600",   dot: "bg-amber-400" },
  edle:        { icon: Key,           color: "bg-teal-100 text-teal-600",     dot: "bg-teal-400" },
  edls:        { icon: LogOut,        color: "bg-orange-100 text-orange-600", dot: "bg-orange-400" },
  paiement:    { icon: Euro,          color: "bg-emerald-100 text-emerald-600",dot: "bg-emerald-400" },
  incident:    { icon: AlertTriangle, color: "bg-red-100 text-red-600",       dot: "bg-red-500" },
  ia:          { icon: Sparkles,      color: "bg-violet-100 text-violet-600", dot: "bg-violet-400" },
  note:        { icon: MessageSquare, color: "bg-slate-100 text-slate-600",   dot: "bg-slate-400" },
  statut:      { icon: Shield,        color: "bg-cyan-100 text-cyan-600",     dot: "bg-cyan-400" },
  creation:    { icon: FolderOpen,    color: "bg-gray-100 text-gray-600",     dot: "bg-gray-400" },
};

function detectType(action) {
  const a = action.toLowerCase();
  if (a.includes("candidat") && !a.includes("sélectionn")) return "candidat";
  if (a.includes("sélectionn") || a.includes("selectionn")) return "selection";
  if (a.includes("document") || a.includes("upload")) return "document";
  if (a.includes("rdv") || a.includes("visite") || a.includes("rendez")) return "rdv";
  if (a.includes("bail")) return "bail";
  if (a.includes("edle") || a.includes("entrée") || a.includes("entree")) return "edle";
  if (a.includes("edls") || a.includes("sortie")) return "edls";
  if (a.includes("paiement") || a.includes("loyer") || a.includes("€")) return "paiement";
  if (a.includes("incident")) return "incident";
  if (a.includes("ia") || a.includes("scoring") || a.includes("analyse")) return "ia";
  if (a.includes("note")) return "note";
  if (a.includes("statut") || a.includes("→")) return "statut";
  if (a.includes("créé") || a.includes("cree") || a.includes("creation")) return "creation";
  return "note";
}

export default function TabTimeline({ dossier, onUpdate }) {
  const [newAction, setNewAction] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");

  const historique = [...(dossier.historique || [])].reverse();

  const addManual = async () => {
    if (!newAction.trim()) return;
    setAdding(true);
    const entry = { date: new Date().toISOString(), action: newAction.trim(), auteur: "Agent", type: "note" };
    const hist = [...(dossier.historique || []), entry];
    await base44.entities.DossierLocatif.update(dossier.id, { historique: hist });
    onUpdate({ historique: hist });
    setNewAction("");
    setAdding(false);
  };

  const FILTERS = [
    { id: "all", label: "Tout" },
    { id: "candidat", label: "Candidats" },
    { id: "document", label: "Documents" },
    { id: "rdv", label: "RDV" },
    { id: "bail", label: "Bail" },
    { id: "incident", label: "Incidents" },
    { id: "note", label: "Notes" },
  ];

  const filtered = filter === "all"
    ? historique
    : historique.filter(h => {
        const type = h.type || detectType(h.action);
        return type === filter;
      });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Journal d'activité</p>
          <p className="text-xs text-muted-foreground mt-0.5">{historique.length} événement{historique.length > 1 ? "s" : ""} enregistré{historique.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Ajouter note manuelle */}
      <div className="flex gap-2">
        <Input
          value={newAction}
          onChange={e => setNewAction(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addManual()}
          placeholder="Ajouter une note manuelle…"
          className="h-9 rounded-xl text-sm flex-1"
        />
        <Button size="sm" className="h-9 rounded-full gap-1 flex-shrink-0" onClick={addManual} disabled={adding || !newAction.trim()}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all ${
              filter === f.id ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 bg-secondary/20 rounded-2xl">
          <Clock className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun événement enregistré</p>
        </div>
      ) : (
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border/40" />

          <div className="space-y-1">
            {filtered.map((h, i) => {
              const type = h.type || detectType(h.action);
              const cfg = EVENT_ICONS[type] || EVENT_ICONS.note;
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex gap-3 pl-0 group">
                  {/* Dot */}
                  <div className="relative flex-shrink-0 flex flex-col items-center" style={{ width: 40 }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${cfg.color} border-2 border-white shadow-sm`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  {/* Contenu */}
                  <div className="flex-1 bg-white border border-border/40 rounded-2xl px-4 py-2.5 mb-2 hover:border-border transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-foreground flex-1">{h.action}</p>
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 whitespace-nowrap">{fmtDT(h.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground/50">{fmtFull(h.date)}</span>
                      {h.auteur && h.auteur !== "Agent" && (
                        <span className="text-[9px] text-primary/70">· par {h.auteur}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}