import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Home, MapPin, Search, Plus, Edit2, Trash2, TrendingUp, KeySquare, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import BienFormModal from "@/components/shared/BienFormModal";

const STATUT_COLORS = {
  disponible: "bg-green-100 text-green-700",
  en_cours: "bg-blue-100 text-blue-700",
  vendu: "bg-slate-100 text-slate-600",
  loue: "bg-purple-100 text-purple-700",
};

const STATUT_LABELS = {
  disponible: "Disponible",
  en_cours: "En cours",
  vendu: "Vendu",
  loue: "Loué",
};

const TYPE_CONFIG = {
  vente: { label: "Vente", color: "bg-blue-100 text-blue-700", icon: TrendingUp, link: "/admin/modules/vente" },
  location: { label: "Location", color: "bg-emerald-100 text-emerald-700", icon: KeySquare, link: "/admin/modules/location" },
};

export default function ModuleBiens() {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "create" | bien_object
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [filterLocalisation, setFilterLocalisation] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.Bien.list("-created_date", 500).then(data => {
      setBiens(data);
      setLoading(false);
    });
  }, []);

  const handleSave = (saved, isEdit) => {
    if (isEdit) {
      setBiens(prev => prev.map(b => b.id === saved.id ? saved : b));
    } else {
      setBiens(prev => [saved, ...prev]);
    }
  };

  const handleDelete = async (bien) => {
    if (!confirm(`Supprimer "${bien.titre}" ?`)) return;
    await base44.entities.Bien.delete(bien.id);
    setBiens(prev => prev.filter(b => b.id !== bien.id));
  };

  const filtered = biens.filter(b => {
    if (filterType !== "tous" && b.type !== filterType) return false;
    if (filterStatut !== "tous" && b.statut !== filterStatut) return false;
    if (filterLocalisation && !b.adresse?.toLowerCase().includes(filterLocalisation.toLowerCase())) return false;
    if (prixMin && (b.prix || 0) < parseFloat(prixMin)) return false;
    if (prixMax && (b.prix || 0) > parseFloat(prixMax)) return false;
    if (search && ![b.titre, b.adresse].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const stats = [
    { label: "Total", value: biens.length, color: "text-slate-700" },
    { label: "Vente", value: biens.filter(b => b.type === "vente").length, color: "text-blue-600" },
    { label: "Location", value: biens.filter(b => b.type === "location").length, color: "text-emerald-600" },
    { label: "Disponibles", value: biens.filter(b => b.statut === "disponible").length, color: "text-green-600" },
  ];

  const hasActiveFilters = filterType !== "tous" || filterStatut !== "tous" || filterLocalisation || prixMin || prixMax;

  const resetFilters = () => {
    setFilterType("tous");
    setFilterStatut("tous");
    setFilterLocalisation("");
    setPrixMin("");
    setPrixMax("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Biens immobiliers</h1>
            <p className="text-sm text-muted-foreground">Vue globale — vente & location</p>
          </div>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setModal("create")}>
          <Plus className="w-4 h-4" /> Ajouter un bien
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters bar */}
      <div className="bg-white rounded-2xl border border-border/50 p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un bien…"
            className="pl-8 h-9 rounded-xl border-0 bg-secondary/50 text-sm"
          />
        </div>

        {/* Quick type filter */}
        <div className="flex gap-1 bg-secondary/40 p-1 rounded-xl">
          {["tous", "vente", "location"].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filterType === t ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "tous" ? "Tous" : t === "vente" ? "Vente" : "Location"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            hasActiveFilters ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtres {hasActiveFilters && <span className="bg-primary text-white text-[10px] px-1.5 rounded-full">!</span>}
        </button>

        {hasActiveFilters && (
          <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-border/50 p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Statut</label>
            <select
              value={filterStatut}
              onChange={e => setFilterStatut(e.target.value)}
              className="w-full h-9 text-sm border border-input rounded-lg px-2 bg-white"
            >
              <option value="tous">Tous</option>
              <option value="disponible">Disponible</option>
              <option value="en_cours">En cours</option>
              <option value="vendu">Vendu</option>
              <option value="loue">Loué</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Localisation</label>
            <Input
              value={filterLocalisation}
              onChange={e => setFilterLocalisation(e.target.value)}
              placeholder="Ville, adresse…"
              className="h-9 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Prix min (€)</label>
            <Input
              type="number"
              value={prixMin}
              onChange={e => setPrixMin(e.target.value)}
              placeholder="0"
              className="h-9 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Prix max (€)</label>
            <Input
              type="number"
              value={prixMax}
              onChange={e => setPrixMax(e.target.value)}
              placeholder="∞"
              className="h-9 rounded-lg text-sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 py-20 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun bien trouvé</p>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-primary hover:underline mt-2">Réinitialiser les filtres</button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/30 text-xs text-muted-foreground">
            {filtered.length} bien{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prix</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Module</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(bien => {
                const typeConf = TYPE_CONFIG[bien.type] || {};
                const TypeIcon = typeConf.icon || Home;
                return (
                  <tr key={bien.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-secondary flex-shrink-0">
                          <Home className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{bien.titre}</p>
                          {bien.adresse && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />{bien.adresse}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium w-fit ${typeConf.color || "bg-secondary text-muted-foreground"}`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeConf.label || bien.type || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {bien.prix ? bien.prix.toLocaleString("fr-FR") + " €" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[bien.statut] || "bg-secondary text-muted-foreground"}`}>
                        {STATUT_LABELS[bien.statut] || bien.statut || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {typeConf.link ? (
                        <Link to={typeConf.link} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <TypeIcon className="w-3 h-3" />
                          {typeConf.label} →
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal(bien)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(bien)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <BienFormModal
          bien={modal === "create" ? null : modal}
          typeDefaut={filterType !== "tous" ? filterType : "vente"}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}