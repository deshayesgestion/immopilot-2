import { useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Plus, ChevronRight, User, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import DossierFormModal from "./DossierFormModal";

const STATUT_CONFIG = {
  nouveau:   { label: "Nouveau",   color: "bg-slate-100 text-slate-600" },
  en_cours:  { label: "En cours",  color: "bg-blue-100 text-blue-700" },
  signe:     { label: "Signé",     color: "bg-green-100 text-green-700" },
  termine:   { label: "Terminé",   color: "bg-purple-100 text-purple-700" },
};

export default function DossiersListSection({ dossiers, typeModule, onDossierCreated }) {
  const [showModal, setShowModal] = useState(false);

  const handleSave = (saved) => {
    onDossierCreated(saved);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Dossiers immobiliers</h3>
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{dossiers.length}</span>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs h-8" onClick={() => setShowModal(true)}>
          <Plus className="w-3.5 h-3.5" /> Nouveau dossier
        </Button>
      </div>

      {dossiers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 py-12 text-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun dossier {typeModule === "vente" ? "de vente" : "de location"}</p>
          <button onClick={() => setShowModal(true)} className="text-xs text-primary hover:underline mt-1">
            Créer le premier dossier →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dossier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contacts</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Créé le</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {dossiers.map(d => {
                const statut = STATUT_CONFIG[d.statut] || { label: d.statut, color: "bg-secondary text-muted-foreground" };
                return (
                  <tr key={d.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 rounded-lg flex-shrink-0">
                          <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <p className="font-medium truncate max-w-[160px]">{d.titre}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[140px]">
                      {d.bien_titre || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" /> {d.contact_ids?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statut.color}`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(d.created_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/dossiers/${d.id}`}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors flex items-center">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <DossierFormModal
          typeDefaut={typeModule}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}