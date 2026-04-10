import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAgency } from "../../hooks/useAgency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Search, Home, X, Upload } from "lucide-react";
import PropertyFormModal from "../../components/admin/PropertyFormModal";

const statusColors = {
  disponible: "bg-green-100 text-green-700",
  sous_compromis: "bg-orange-100 text-orange-700",
  vendu: "bg-gray-100 text-gray-600",
  loue: "bg-blue-100 text-blue-700",
};

const typeLabels = { maison: "Maison", appartement: "Appt.", terrain: "Terrain", local_commercial: "Local", bureau: "Bureau" };

export default function AdminProperties() {
  const { agency } = useAgency();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Property.list("-created_date", 100);
    setProperties(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce bien ?")) return;
    await base44.entities.Property.delete(id);
    setProperties((p) => p.filter((x) => x.id !== id));
  };

  const handleSave = async (data) => {
    const payload = { ...data, agency_id: agency?.id || "default" };
    if (editItem) {
      const updated = await base44.entities.Property.update(editItem.id, payload);
      setProperties((p) => p.map((x) => (x.id === editItem.id ? updated : x)));
    } else {
      const created = await base44.entities.Property.create(payload);
      setProperties((p) => [created, ...p]);
    }
    setModalOpen(false);
    setEditItem(null);
  };

  const filtered = properties.filter((p) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des biens</h1>
          <p className="text-muted-foreground text-sm mt-1">{properties.length} biens au total</p>
        </div>
        <Button
          className="rounded-full gap-2"
          onClick={() => { setEditItem(null); setModalOpen(true); }}
        >
          <Plus className="w-4 h-4" />
          Ajouter un bien
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un bien..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-full bg-white h-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Home className="w-8 h-8 mx-auto mb-3 opacity-20" />
          <p>Aucun bien trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-xs">
                <th className="text-left px-5 py-3 font-medium">Bien</th>
                <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Type</th>
                <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">Transaction</th>
                <th className="text-left px-3 py-3 font-medium">Prix</th>
                <th className="text-left px-3 py-3 font-medium hidden sm:table-cell">Statut</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium truncate max-w-[180px]">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.city} · {p.surface}m²</p>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell text-muted-foreground">
                    {typeLabels[p.type] || p.type}
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.transaction === "vente" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                      {p.transaction}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-semibold">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p.price)}
                    {p.transaction === "location" && <span className="text-xs font-normal text-muted-foreground">/m</span>}
                  </td>
                  <td className="px-3 py-3.5 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(p); setModalOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <PropertyFormModal
          property={editItem}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}