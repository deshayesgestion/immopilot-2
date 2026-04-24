import { useState } from "react";
import { base44 } from "@/api/base44Client";
import DossierHeader from "../dossier/DossierHeader";
import TabCandidats from "../dossier/TabCandidats";
import TabDocuments from "../dossier/TabDocuments";
import TabRDV from "../dossier/TabRDV";
import TabIA from "../dossier/TabIA";
import TabBail from "../dossier/TabBail";
import TabEDL from "../dossier/TabEDL";
import TabInfos from "../dossier/TabInfos";
import TabTimeline from "../dossier/TabTimeline";
import TabIncidents from "../dossier/TabIncidents";
import TabNotes from "../dossier/TabNotes";
import TabFinances from "../dossier/TabFinances";

const TABS = [
  { id: "candidats", label: "Candidats", emoji: "👤" },
  { id: "documents", label: "Documents", emoji: "📂" },
  { id: "rdv",       label: "RDV",       emoji: "📅" },
  { id: "ia",        label: "IA",        emoji: "✨" },
  { id: "bail",      label: "Bail",      emoji: "📝" },
  { id: "edle",      label: "EDL Entrée",emoji: "🔑" },
  { id: "edls",      label: "EDL Sortie",emoji: "📦" },
  { id: "finances",  label: "Finances",  emoji: "💶" },
  { id: "incidents", label: "Incidents", emoji: "⚠️" },
  { id: "notes",     label: "Notes",     emoji: "🔒" },
  { id: "timeline",  label: "Journal",   emoji: "📋" },
  { id: "infos",     label: "Infos",     emoji: "ℹ️" },
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
      historique: [...(d.historique || []), {
        date: new Date().toISOString(),
        action: `Statut → ${statut_dossier}`,
        auteur: "Agent"
      }],
    });
    const updated = { ...d, statut_dossier };
    setD(updated);
    onUpdate(updated);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header sticky */}
        <DossierHeader
          dossier={d}
          saving={saving}
          onClose={onClose}
          onStatutChange={handleStatutChange}
        />

        {/* Onglets — tous librement accessibles, pas de blocage */}
        <div className="border-b border-border/30 bg-secondary/5 overflow-x-auto flex-shrink-0">
          <div className="flex gap-0.5 px-3 py-2 min-w-max">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  tab === t.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white"
                }`}
              >
                <span className="text-sm">{t.emoji}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "candidats" && <TabCandidats dossier={d} onDossierUpdate={handleSubSave} />}
          {tab === "documents" && <TabDocuments dossier={d} />}
          {tab === "rdv"       && <TabRDV dossier={d} />}
          {tab === "ia"        && <TabIA dossier={d} />}
          {tab === "bail"      && <TabBail dossier={d} onSave={handleSubSave} />}
          {tab === "edle"      && <TabEDL dossier={d} type="edle" onSave={handleSubSave} />}
          {tab === "edls"      && <TabEDL dossier={d} type="edls" onSave={handleSubSave} />}
          {tab === "finances"  && <TabFinances dossier={d} />}
          {tab === "incidents" && <TabIncidents dossier={d} onUpdate={handleSubSave} />}
          {tab === "notes"     && <TabNotes dossier={d} onUpdate={handleSubSave} />}
          {tab === "timeline"  && <TabTimeline dossier={d} onUpdate={handleSubSave} />}
          {tab === "infos"     && <TabInfos dossier={d} onSave={handleSubSave} />}
        </div>
      </div>
    </div>
  );
}