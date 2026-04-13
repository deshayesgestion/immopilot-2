import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, Home, Globe, Tag, TrendingUp } from "lucide-react";
import BienVenteForm from "../../components/admin/vente/BienVenteForm";

const STATUS_COLORS = {
  disponible: "bg-green-100 text-green-700",
  sous_offre: "bg-amber-100 text-amber-700",
  sous_compromis: "bg-blue-100 text-blue-700",
  vendu: "bg-gray-100 text-gray-500",
};
const STATUS_LABELS = {
  disponible: "Disponible",
  sous_offre: "Sous offre",
  sous_compromis: "Compromis",
  vendu: "Vendu",
};

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function AdminVenteBiens() {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editBien, setEditBien] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Property.filter({ transaction: "vente" }, "-created_date", 100);
    setBiens(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return biens;
    const q = search.toLowerCase();
    return biens.filter((b) =>
      [b.title, b.city, b.address, b.agent_email].some((v) => v?.toLowerCase().includes(q))
    );
  }, [biens, search]);

  const stats = {
    total: biens.length,
    disponible: biens.filter((b) => b.status === "disponible").length,
    sous_compromis: biens.filter((b) => b.status === "sous_compromis").length,
    vendu: biens.filter((b) => b.status === "vendu").length,
    caTotal: biens.filter((b) => b.status === "vendu").reduce((s, b) => s + (b.price || 0), 0),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showForm && (
        <BienVenteForm bien={editBien} onClose={() => { setShowForm(false); setEditBien(null); }} onSave={load} />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biens à vendre</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Portefeuille de biens en vente</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => { setEditBien(null); setShowForm(true); }} className="rounded-full gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Ajouter un bien
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Total biens</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold text-green-600">{stats.disponible}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Disponibles</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold text-blue-600">{stats.sous_compromis}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Sous compromis</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold text-primary">{fmt(stats.caTotal)}</p>
          <p className="text-sm text-muted-foreground mt-0.5">CA vendus</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 rounded-full bg-secondary/50 border-0" />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground text-sm">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-16">
          <Home className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium">Aucun bien</p>
          <p className="text-xs text-muted-foreground mt-1">Ajoutez votre premier bien à vendre</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Home className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.city} · {b.surface}m² · {b.rooms} pièces</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-sm font-bold">{fmt(b.price)}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-500"}`}>
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                  {b.publish_site && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Publié
                    </span>
                  )}
                  <Button size="sm" variant="outline" className="rounded-full h-7 text-xs"
                    onClick={() => { setEditBien(b); setShowForm(true); }}>
                    Modifier
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border/30 bg-secondary/20">
            <p className="text-xs text-muted-foreground">{filtered.length} bien{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}