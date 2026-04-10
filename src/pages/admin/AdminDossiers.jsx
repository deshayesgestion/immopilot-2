import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Plus, Search, X, Loader2, ChevronRight, Home } from "lucide-react";

const STATUS_COLORS = {
  en_cours: "bg-blue-100 text-blue-700",
  signe: "bg-green-100 text-green-700",
  archive: "bg-gray-100 text-gray-500",
  annule: "bg-red-100 text-red-600",
};
const STATUS_LABELS = { en_cours: "En cours", signe: "Signé", archive: "Archivé", annule: "Annulé" };
const TYPE_COLORS = { location: "bg-orange-100 text-orange-700", vente: "bg-violet-100 text-violet-700" };

function DossierModal({ dossier, onClose, onSave }) {
  const [form, setForm] = useState(dossier || { type: "location", statut: "en_cours", client_nom: "", client_email: "", agent_email: "", property_title: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (dossier?.id) await base44.entities.Dossier.update(dossier.id, form);
    else await base44.entities.Dossier.create(form);
    await onSave();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4 border border-border/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">{dossier ? "Modifier le dossier" : "Nouveau dossier"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="vente">Vente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Statut</label>
              <Select value={form.statut} onValueChange={(v) => set("statut", v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="signe">Signé</SelectItem>
                  <SelectItem value="archive">Archivé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nom du client</label>
            <Input required placeholder="Jean Dupont" value={form.client_nom} onChange={(e) => set("client_nom", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email du client</label>
            <Input type="email" placeholder="client@email.fr" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Agent assigné (email)</label>
            <Input placeholder="agent@agence.fr" value={form.agent_email} onChange={(e) => set("agent_email", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Bien associé</label>
            <Input placeholder="Appartement 3 pièces - Paris 11e" value={form.property_title} onChange={(e) => set("property_title", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes internes</label>
            <Input placeholder="Remarques..." value={form.notes} onChange={(e) => set("notes", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-full gap-2 h-10" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function DossierRow({ dossier, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors rounded-xl cursor-pointer"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[dossier.type]}`}>
        <FolderOpen className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{dossier.client_nom}</p>
        <p className="text-xs text-muted-foreground truncate">
          {dossier.property_title || "—"} {dossier.agent_email ? `· Agent: ${dossier.agent_email}` : ""}
        </p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${TYPE_COLORS[dossier.type]}`}>
        {dossier.type}
      </span>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[dossier.statut]}`}>
        {STATUS_LABELS[dossier.statut]}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
    </div>
  );
}

export default function AdminDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState(null); // null | "new" | dossier object

  const load = async () => {
    const data = await base44.entities.Dossier.list("-created_date", 100);
    setDossiers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = dossiers.filter((d) => {
    const matchSearch = [d.client_nom, d.client_email, d.property_title, d.agent_email].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === "all" || d.type === filterType;
    const matchStatus = filterStatus === "all" || d.statut === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {modal && (
        <DossierModal
          dossier={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dossiers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des dossiers location et vente</p>
        </div>
        <Button onClick={() => setModal("new")} className="rounded-full gap-2 h-9 text-sm">
          <Plus className="w-4 h-4" /> Nouveau dossier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: dossiers.length, color: "text-foreground" },
          { label: "En cours", value: dossiers.filter((d) => d.statut === "en_cours").length, color: "text-blue-600" },
          { label: "Location", value: dossiers.filter((d) => d.type === "location").length, color: "text-orange-600" },
          { label: "Vente", value: dossiers.filter((d) => d.type === "vente").length, color: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-full bg-secondary/50 border-0" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 h-9 rounded-full bg-secondary/50 border-0 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="vente">Vente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 rounded-full bg-secondary/50 border-0 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="signe">Signé</SelectItem>
            <SelectItem value="archive">Archivé</SelectItem>
            <SelectItem value="annule">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun dossier trouvé</p>
          </div>
        ) : (
          <div className="p-2">
            {filtered.map((d) => <DossierRow key={d.id} dossier={d} onClick={() => setModal(d)} />)}
          </div>
        )}
      </div>
    </div>
  );
}