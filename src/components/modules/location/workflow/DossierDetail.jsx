import { useState } from "react";
import { base44 } from "@/api/base44Client";
import DossierHeader from "../dossier/DossierHeader";
import TabCandidats from "../dossier/TabCandidats";
import TabRDV from "../dossier/TabRDV";
import TabBail from "../dossier/TabBail";
import TabEDL from "../dossier/TabEDL";
import TabInfos from "../dossier/TabInfos";
import { Users, Calendar, FileText, Key, LogOut, Info } from "lucide-react";

const TABS = [
  { id: "candidats",  label: "Candidats",    icon: Users,      emoji: "👤" },
  { id: "rdv",        label: "RDV",          icon: Calendar,   emoji: "📅" },
  { id: "bail",       label: "Bail",         icon: FileText,   emoji: "📝" },
  { id: "edle",       label: "EDL Entrée",   icon: Key,        emoji: "🔑" },
  { id: "edls",       label: "EDL Sortie",   icon: LogOut,     emoji: "📦" },
  { id: "infos",      label: "Infos",        icon: Info,       emoji: "ℹ️" },
];

export default function DossierDetail({ dossier: initialDossier, onClose, onUpdate }) {
  const [d, setD] = useState(initialDossier);
  const [tab, setTab] = useState("candidats");
  const [saving, setSaving] = useState(false);

  const handleSubSave = (data) => {
    const updated = { ...d, ...data };
    setD(updated);
    onUpdate(updated);
  };

  const handleStatutChange = async (statut_dossier) => {
    setSaving(true);
    await base44.entities.DossierLocatif.update(d.id, {
      statut_dossier,
      historique: [...(d.historique || []), { date: new Date().toISOString(), action: `Statut → ${statut_dossier}`, auteur: "Agent" }],
    });
    const updated = { ...d, statut_dossier };
    setD(updated);
    onUpdate(updated);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <DossierHeader
          dossier={d}
          saving={saving}
          onClose={onClose}
          onStatutChange={handleStatutChange}
        />

        {/* Tabs libres — toutes accessibles */}
        <div className="px-4 py-2 border-b border-border/30 bg-secondary/10 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white"
                }`}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu onglet — scroll */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "candidats" && <TabCandidats dossier={d} onDossierUpdate={handleSubSave} />}
          {tab === "rdv"       && <TabRDV dossier={d} />}
          {tab === "bail"      && <TabBail dossier={d} onSave={handleSubSave} />}
          {tab === "edle"      && <TabEDL dossier={d} type="edle" onSave={handleSubSave} />}
          {tab === "edls"      && <TabEDL dossier={d} type="edls" onSave={handleSubSave} />}
          {tab === "infos"     && <TabInfos dossier={d} onSave={handleSubSave} />}
        </div>
      </div>
    </div>
  );
}