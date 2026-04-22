import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FolderOpen, Plus, ChevronRight, Search, Loader2, TrendingUp, KeySquare, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DossierFormModal from "@/components/shared/DossierFormModal";

const STATUT_CONFIG = {
  nouveau:   { label: "Nouveau",   color: "bg-slate-100 text-slate-600" },
  en_cours:  { label: "En cours",  color: "bg-blue-100 text-blue-700" },
  signe:     { label: "Signé",     color: "bg-green-100 text-green-700" },
  termine:   { label: "Terminé",   color: "bg-purple-100 text-purple-700" },
};

const TYPE_CONFIG = {
  vente:    { label: "Vente",    icon: TrendingUp, color: "bg-blue-100 text-blue-700" },
  location: { label: "Location", icon: KeySquare,  color: "bg-emerald-100 text-emerald-700" },
};

export default function AdminDossiersImmobiliers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    base44.entities.DossierImmobilier.list("-created_date", 500).then(data => {
      setDossiers(data);
      setLoading(false);
    });
  }, []);

  const filtered = dossiers.filter(d => {
    if (filterType !== "tous" && d.type !== filterType) return false;
    if (filterStatut !== "tous" && d.statut !== filterStatut) return false;
    if (search && ![d.titre, d.bien_titre].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const stats = [
    { label: "Total", value: dossiers.length, color: "text-slate-700" },
    { label: "Vente", value: dossiers.filter(d => d.type === "vente").length, color: "text-blue-600" },
    { label: "Location", value: dossiers.filter(d => d.type === "location").length, color: "text-emerald-600" },
    { label: "En cours", value: dossiers.filter(d => d.statut === "en_cours").length, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dossiers immobiliers</h1>
            <p className="text-sm text-muted-foreground">Vue centralisée de toutes les affaires</p>
          </div>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Nouveau dossier
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

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border/50 p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un dossier…"
            className="pl-8 h-9 rounded-xl border-0 bg-secondary/50 text-sm" />
        </div>
        <div className="flex gap-1 bg-secondary/40 p-1 rounded-xl">
          {["tous", "vente", "location"].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === t ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "tous" ? "Tous" : t === "vente" ? "Vente" : "Location"}
            </button>
          ))}
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="h-9 px-3 text-sm border border-input rounded-xl bg-white">
          <option value="tous">Tous statuts</option>
          <option value="nouveau">Nouveau</option>
          <option value="en_cours">En cours</option>
          <option value="signe">Signé</option>
          <option value="termine">Terminé</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 py-20 text-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun dossier trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/30 text-xs text-muted-foreground">
            {filtered.length} dossier{filtered.length > 1 ? "s" : ""}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dossier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contacts</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Créé le</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(d => {
                const statut = STATUT_CONFIG[d.statut] || { label: d.statut, color: "bg-secondary text-muted-foreground" };
                const typeConf = TYPE_CONFIG[d.type] || {};
                const TypeIcon = typeConf.icon;
                return (
                  <tr key={d.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 rounded-lg flex-shrink-0">
                          <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <p className="font-medium">{d.titre}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{d.bien_titre || "—"}</td>
                    <td className="px-4 py-3">
                      {TypeIcon && (
                        <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium w-fit ${typeConf.color}`}>
                          <TypeIcon className="w-3 h-3" /> {typeConf.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" /> {d.contact_ids?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statut.color}`}>{statut.label}</span>
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
          onClose={() => setShowModal(false)}
          onSave={(saved) => { setDossiers(prev => [saved, ...prev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}