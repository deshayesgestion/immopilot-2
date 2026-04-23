import { useState } from "react";
import { Home, Tag, Check, Filter } from "lucide-react";

const STATUS_LABELS = { disponible: "Disponible", en_cours: "En cours", vendu: "Vendu", loue: "Loué" };
const TYPE_COLORS = { vente: "bg-blue-100 text-blue-700", location: "bg-emerald-100 text-emerald-700" };

export default function LandingEditorBiens({ form, set, biens }) {
  const [filter, setFilter] = useState("all");

  const filteredBiens = biens.filter(b => filter === "all" || b.type === filter);
  const selectedIds = form.lp_featured_biens_ids || [];

  const toggleBien = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    set("lp_featured_biens_ids", next);
  };

  const selectAll = () => set("lp_featured_biens_ids", filteredBiens.map(b => b.id));
  const clearAll = () => set("lp_featured_biens_ids", []);

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Biens en avant sur la landing</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedIds.length} bien{selectedIds.length !== 1 ? "s" : ""} sélectionné{selectedIds.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
            {["all", "vente", "location"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all capitalize ${filter === f ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
                {f === "all" ? "Tous" : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={selectAll} className="text-xs text-primary hover:underline">Tout sélectionner</button>
        <span className="text-muted-foreground/50">·</span>
        <button onClick={clearAll} className="text-xs text-muted-foreground hover:underline">Tout désélectionner</button>
      </div>

      {filteredBiens.length === 0 ? (
        <div className="text-center py-10">
          <Home className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun bien trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
          {filteredBiens.map(bien => {
            const isSelected = selectedIds.includes(bien.id);
            return (
              <button key={bien.id} onClick={() => toggleBien(bien.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40 hover:border-primary/30 hover:bg-secondary/20"
                }`}>
                <div className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                  {bien.photo_principale ? (
                    <img src={bien.photo_principale} alt={bien.titre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{bien.titre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[bien.type] || "bg-gray-100 text-gray-600"}`}>
                      {bien.type}
                    </span>
                    {bien.prix && <span className="text-[10px] text-muted-foreground">{bien.prix.toLocaleString("fr-FR")} €</span>}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                  isSelected ? "bg-primary border-primary" : "border-border"
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="border-t border-border/30 pt-3">
        <p className="text-xs text-muted-foreground mb-2">Filtre affiché sur le site</p>
        <div className="flex gap-2">
          {[{ v: "all", l: "Tous" }, { v: "vente", l: "Vente uniquement" }, { v: "location", l: "Location uniquement" }].map(opt => (
            <button key={opt.v} onClick={() => set("lp_featured_filter", opt.v)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                form.lp_featured_filter === opt.v ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"
              }`}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}