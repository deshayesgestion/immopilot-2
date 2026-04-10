import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FolderOpen, ChevronRight, Loader2, X } from "lucide-react";

const STATUS_CONFIG = {
  en_cours: { label: "En cours", color: "bg-blue-100 text-blue-700" },
  en_attente: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  termine: { label: "Terminé", color: "bg-green-100 text-green-700" },
  archive: { label: "Archivé", color: "bg-gray-100 text-gray-500" },
};

const TOTAL_STEPS = 11;

function NewDossierModal({ onClose, onSave }) {
  const [form, setForm] = useState({ property_title: "", property_address: "", agent_email: "", agent_name: "", owner_name: "", loyer: "", charges: "", depot_garantie: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ref = "DL-" + Date.now().toString().slice(-6);
    await base44.entities.DossierLocatif.create({
      ...form,
      reference: ref,
      loyer: Number(form.loyer) || 0,
      charges: Number(form.charges) || 0,
      depot_garantie: Number(form.depot_garantie) || 0,
      current_step: 1,
      steps_completed: [],
      candidatures: [],
      visites: [],
      documents: [],
      paiements: [],
      incidents: [],
    });
    await onSave();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
          <h3 className="text-base font-bold">Nouveau dossier locatif</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-3">
          <div><label className="text-sm font-medium mb-1.5 block">Bien immobilier</label>
            <Input required placeholder="Appartement T3 — Paris 11e" value={form.property_title} onChange={(e) => set("property_title", e.target.value)} className="h-10 rounded-xl" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Adresse</label>
            <Input placeholder="12 rue de la Paix, 75001 Paris" value={form.property_address} onChange={(e) => set("property_address", e.target.value)} className="h-10 rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Agent (email)</label>
              <Input required placeholder="agent@agence.fr" value={form.agent_email} onChange={(e) => set("agent_email", e.target.value)} className="h-10 rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Propriétaire</label>
              <Input placeholder="M. Dupont" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} className="h-10 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Loyer (€)</label>
              <Input type="number" placeholder="1200" value={form.loyer} onChange={(e) => set("loyer", e.target.value)} className="h-10 rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Charges (€)</label>
              <Input type="number" placeholder="150" value={form.charges} onChange={(e) => set("charges", e.target.value)} className="h-10 rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Dépôt (€)</label>
              <Input type="number" placeholder="2400" value={form.depot_garantie} onChange={(e) => set("depot_garantie", e.target.value)} className="h-10 rounded-xl" /></div>
          </div>
          <Button type="submit" className="w-full rounded-full h-10 mt-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer le dossier"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function DossierLocatif() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.DossierLocatif.list("-created_date", 100);
    setDossiers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = dossiers.filter((d) => {
    const matchSearch = [d.property_title, d.property_address, d.agent_email, d.reference].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || d.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const getProgress = (d) => {
    const completed = (d.steps_completed || []).length;
    return Math.round((completed / TOTAL_STEPS) * 100);
  };

  const fmt = (n) => n ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n) : "—";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showNew && <NewDossierModal onClose={() => setShowNew(false)} onSave={load} />}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dossier locatif</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cycle complet de location — de la candidature à la clôture</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-full gap-2 h-9 text-sm flex-shrink-0">
          <Plus className="w-4 h-4" /> Nouveau dossier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: dossiers.length },
          { label: "En cours", value: dossiers.filter((d) => d.statut === "en_cours").length, color: "text-blue-600" },
          { label: "En attente", value: dossiers.filter((d) => d.statut === "en_attente").length, color: "text-amber-600" },
          { label: "Terminés", value: dossiers.filter((d) => d.statut === "termine").length, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
            <p className={`text-2xl font-bold ${s.color || "text-foreground"}`}>{s.value}</p>
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 rounded-full bg-secondary/50 border-0 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
            <SelectItem value="archive">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun dossier trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((d) => {
              const progress = getProgress(d);
              const status = STATUS_CONFIG[d.statut] || STATUS_CONFIG.en_cours;
              return (
                <div
                  key={d.id}
                  onClick={() => navigate(`/admin/dossier-locatif/${d.id}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">{d.property_title}</p>
                      <span className="text-xs text-muted-foreground/50 flex-shrink-0">{d.reference}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{d.property_address || "Adresse non renseignée"} · Agent : {d.agent_email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 max-w-[140px] h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">{progress}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {d.loyer > 0 && <span className="text-sm font-semibold hidden sm:block">{fmt(d.loyer)}<span className="text-xs font-normal text-muted-foreground">/m</span></span>}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}