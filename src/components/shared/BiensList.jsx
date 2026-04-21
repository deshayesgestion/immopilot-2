import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Home, MapPin, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BienFormModal from "./BienFormModal";

const STATUT_COLORS = {
  disponible: "bg-green-100 text-green-700",
  en_cours: "bg-blue-100 text-blue-700",
  vendu: "bg-slate-100 text-slate-600",
  loue: "bg-purple-100 text-purple-700",
};

export default function BiensList({ biens, typeModule, leads = [], onBiensChange, search = "" }) {
  const [modal, setModal] = useState(null); // null | "create" | bien_object

  const filtered = biens.filter(b =>
    [b.titre, b.adresse].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const leadsParBien = leads.reduce((acc, l) => {
    if (l.bien_id) acc[l.bien_id] = (acc[l.bien_id] || 0) + 1;
    return acc;
  }, {});

  const handleSave = (saved, isEdit) => {
    if (isEdit) {
      onBiensChange(prev => prev.map(b => b.id === saved.id ? saved : b));
    } else {
      onBiensChange(prev => [...prev, saved]);
    }
  };

  const handleDelete = async (bien) => {
    if (!confirm(`Supprimer "${bien.titre}" ?`)) return;
    await base44.entities.Bien.delete(bien.id);
    onBiensChange(prev => prev.filter(b => b.id !== bien.id));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="rounded-xl gap-2" onClick={() => setModal("create")}>
          <Plus className="w-3.5 h-3.5" /> Nouveau bien
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">
          Aucun bien {typeModule === "location" ? "en location" : "à vendre"}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prix</th>
                {typeModule === "vente" && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Leads</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(bien => (
                <tr key={bien.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${typeModule === "location" ? "bg-emerald-50" : "bg-blue-50"}`}>
                        <Home className={`w-3.5 h-3.5 ${typeModule === "location" ? "text-emerald-500" : "text-blue-500"}`} />
                      </div>
                      <div>
                        <p className="font-medium">{bien.titre}</p>
                        {bien.adresse && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{bien.adresse}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {bien.prix ? bien.prix.toLocaleString("fr-FR") + " €" : "—"}
                  </td>
                  {typeModule === "vente" && (
                    <td className="px-4 py-3">
                      <span className="inline-flex text-xs bg-secondary px-2 py-1 rounded-full font-medium">
                        {leadsParBien[bien.id] || 0} lead{(leadsParBien[bien.id] || 0) > 1 ? "s" : ""}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[bien.statut] || "bg-secondary text-muted-foreground"}`}>
                      {bien.statut || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(bien)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" title="Modifier">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(bien)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <BienFormModal
          bien={modal === "create" ? null : modal}
          typeDefaut={typeModule}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}