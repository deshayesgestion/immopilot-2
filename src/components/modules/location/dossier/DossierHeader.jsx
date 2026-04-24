import { Loader2, X, Home, Euro, User } from "lucide-react";

const STATUT_CFG = {
  ouvert:             { label: "Ouvert",            cls: "bg-slate-100 text-slate-700" },
  en_selection:       { label: "En sélection",      cls: "bg-blue-100 text-blue-700" },
  candidat_valide:    { label: "Candidat validé",   cls: "bg-indigo-100 text-indigo-700" },
  bail_signe:         { label: "Bail signé",         cls: "bg-purple-100 text-purple-700" },
  en_cours:           { label: "En cours",           cls: "bg-emerald-100 text-emerald-700" },
  termine:            { label: "Terminé",            cls: "bg-gray-100 text-gray-600" },
};

export default function DossierHeader({ dossier, saving, onClose, onStatutChange }) {
  const statut = STATUT_CFG[dossier.statut_dossier] || STATUT_CFG.ouvert;

  return (
    <div className="flex items-start justify-between p-5 border-b border-border/50 sticky top-0 bg-white z-10">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${statut.cls}`}>{statut.label}</span>
          {dossier.reference && <span className="text-xs text-muted-foreground">{dossier.reference}</span>}
        </div>
        <h2 className="text-base font-bold mt-1 truncate">{dossier.locataire_nom || "Nouveau dossier"}</h2>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          {dossier.bien_titre && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{dossier.bien_titre}</span>}
          {dossier.loyer_mensuel > 0 && <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{dossier.loyer_mensuel?.toLocaleString("fr-FR")} €/mois</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <select value={dossier.statut_dossier || "ouvert"} onChange={e => onStatutChange(e.target.value)}
          className="h-8 rounded-full border border-input bg-white px-2.5 text-xs font-medium">
          {Object.entries(STATUT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary/60">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}