import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Home, Users, Globe, BarChart3, Loader2, RefreshCw } from "lucide-react";
import BienLocationForm from "../../components/admin/location/BienLocationForm";
import BienLocationList from "../../components/admin/location/BienLocationList";

const TABS = [
  { id: "biens", label: "Biens en location", icon: Home },
  { id: "publications", label: "Publications", icon: Globe },
  { id: "stats", label: "Aperçu", icon: BarChart3 },
];

function StatCard({ label, value, sub, color = "text-foreground" }) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function PublicationRow({ bien }) {
  const published = bien.publish_site;
  const platforms = bien.publish_platforms;
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors rounded-xl">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${published ? "bg-green-500" : "bg-gray-300"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{bien.title}</p>
        <p className="text-xs text-muted-foreground">{bien.city} · {bien.price}€/mois</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {published ? "Site ✓" : "Site ✗"}
        </div>
        <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${platforms ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
          {platforms ? "Plateformes ✓" : "Plateformes ✗"}
        </div>
      </div>
    </div>
  );
}

export default function AdminLocation() {
  const [tab, setTab] = useState("biens");
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editBien, setEditBien] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Property.filter({ transaction: "location" }, "-created_date", 100);
    setBiens(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return biens.filter((b) => {
      const matchSearch = [b.title, b.city, b.address, b.agent_email].some(
        (v) => v?.toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [biens, search, filterStatus]);

  const stats = {
    total: biens.length,
    publie: biens.filter((b) => b.status === "disponible").length,
    loue: biens.filter((b) => b.status === "loue").length,
    enCours: biens.filter((b) => b.status === "sous_compromis").length,
    published: biens.filter((b) => b.publish_site).length,
  };

  const openNew = () => { setEditBien(null); setShowForm(true); };
  const openEdit = (b) => { setEditBien(b); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditBien(null); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showForm && (
        <BienLocationForm bien={editBien} onClose={closeForm} onSave={load} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion Location</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cycle complet des biens en location</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={load} className="p-2 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={openNew} className="rounded-full gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Créer un bien
          </Button>
        </div>
      </div>

      {/* Stats mini */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total biens" value={stats.total} />
        <StatCard label="Publiés" value={stats.publie} color="text-green-600" sub="Visibles sur le site" />
        <StatCard label="Loués" value={stats.loue} color="text-blue-600" />
        <StatCard label="Sur le site" value={stats.published} color="text-primary" sub="Publications actives" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters (biens tab only) */}
      {tab === "biens" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-full bg-secondary/50 border-0"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-9 rounded-full bg-secondary/50 border-0 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="disponible">Publié</SelectItem>
              <SelectItem value="loue">Loué</SelectItem>
              <SelectItem value="sous_compromis">En cours</SelectItem>
              <SelectItem value="vendu">Archivé</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground self-center">{filtered.length} bien{filtered.length > 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : tab === "biens" ? (
        <BienLocationList biens={filtered} onEdit={openEdit} onRefresh={load} />
      ) : tab === "publications" ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold">État des publications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{stats.published} bien{stats.published > 1 ? "s" : ""} visible{stats.published > 1 ? "s" : ""} sur le site public</p>
          </div>
          <div className="p-2">
            {biens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Aucun bien à afficher</p>
            ) : (
              biens.map((b) => <PublicationRow key={b.id} bien={b} />)
            )}
          </div>
          <div className="px-5 py-4 border-t border-border/50 bg-secondary/20">
            <p className="text-xs text-muted-foreground font-medium mb-1">Plateformes externes</p>
            <div className="flex flex-wrap gap-2">
              {["SeLoger", "Leboncoin", "Logic-Immo", "PAP", "Bien'ici"].map((p) => (
                <span key={p} className="text-xs px-3 py-1.5 rounded-full bg-white border border-border/50 text-muted-foreground">
                  {p} — <span className="text-primary font-medium">Bientôt</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Stats tab */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">Répartition par statut</h3>
            <div className="space-y-3">
              {[
                { label: "Publiés", value: stats.publie, color: "bg-green-500", total: stats.total },
                { label: "Loués", value: stats.loue, color: "bg-blue-500", total: stats.total },
                { label: "En cours", value: stats.enCours, color: "bg-amber-400", total: stats.total },
              ].map(({ label, value, color, total }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all`}
                      style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">Publication</h3>
            <div className="space-y-4">
              {[
                { label: "Publiés sur le site", value: stats.published, total: stats.total, color: "bg-primary" },
                { label: "En vedette (accueil)", value: biens.filter((b) => b.featured).length, total: stats.total, color: "bg-amber-400" },
              ].map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium">{value} / {total}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}