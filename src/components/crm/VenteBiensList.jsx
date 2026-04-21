import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Home, MapPin, Edit2, CheckCircle } from "lucide-react";

const STATUT_OPTIONS = ["disponible", "en_cours", "vendu"];
const STATUT_COLORS = {
  disponible: "bg-green-100 text-green-700",
  en_cours: "bg-blue-100 text-blue-700",
  vendu: "bg-slate-100 text-slate-600",
};

export default function VenteBiensList({ biens, leads, contactMap, onBiensChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editStatut, setEditStatut] = useState("");

  const leadsParBien = leads.reduce((acc, l) => {
    if (l.bien_id) { acc[l.bien_id] = (acc[l.bien_id] || 0) + 1; }
    return acc;
  }, {});

  const startEdit = (bien) => {
    setEditingId(bien.id);
    setEditStatut(bien.statut || "disponible");
  };

  const saveStatut = async (bien) => {
    const updated = { ...bien, statut: editStatut };
    onBiensChange(prev => prev.map(b => b.id === bien.id ? updated : b));
    await base44.entities.Bien.update(bien.id, { statut: editStatut });
    setEditingId(null);
  };

  if (!biens.length)
    return <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">Aucun bien à vendre</div>;

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            {["Bien", "Prix", "Leads actifs", "Statut", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {biens.map(bien => (
            <tr key={bien.id} className="hover:bg-secondary/10 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg flex-shrink-0">
                    <Home className="w-3.5 h-3.5 text-blue-500" />
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
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full font-medium">
                  {leadsParBien[bien.id] || 0} lead{(leadsParBien[bien.id] || 0) > 1 ? "s" : ""}
                </span>
              </td>
              <td className="px-4 py-3">
                {editingId === bien.id ? (
                  <select
                    value={editStatut}
                    onChange={e => setEditStatut(e.target.value)}
                    className="text-xs border border-border rounded-lg px-2 py-1 bg-white"
                    autoFocus
                  >
                    {STATUT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[bien.statut] || "bg-secondary text-muted-foreground"}`}>
                    {bien.statut || "—"}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {editingId === bien.id ? (
                    <button onClick={() => saveStatut(bien)} className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => startEdit(bien)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}