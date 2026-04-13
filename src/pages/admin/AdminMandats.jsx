import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, FileSignature, ChevronRight } from "lucide-react";
import MandatDetail from "../../components/admin/vente/MandatDetail";

const STATUT_LABELS = {
  contact: "Prise de contact",
  estimation: "Estimation",
  visite: "Visite & CR",
  diagnostics: "Diagnostics",
  mandat_signe: "Mandat signé",
  en_vente: "En vente",
  abandonne: "Abandonné",
};

const STATUT_COLORS = {
  contact: "bg-gray-100 text-gray-600",
  estimation: "bg-amber-100 text-amber-700",
  visite: "bg-blue-100 text-blue-700",
  diagnostics: "bg-purple-100 text-purple-700",
  mandat_signe: "bg-green-100 text-green-700",
  en_vente: "bg-emerald-100 text-emerald-700",
  abandonne: "bg-red-100 text-red-500",
};

const STEPS_ORDER = ["contact", "estimation", "visite", "diagnostics", "mandat_signe", "en_vente"];

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function AdminMandats() {
  const [mandats, setMandats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.MandatVente.list("-created_date", 200);
    setMandats(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return mandats;
    const q = search.toLowerCase();
    return mandats.filter((m) =>
      [m.vendeur_nom, m.vendeur_email, m.bien_ville, m.bien_adresse, m.reference].some((v) => v?.toLowerCase().includes(q))
    );
  }, [mandats, search]);

  const stats = {
    total: mandats.length,
    actifs: mandats.filter((m) => !["en_vente", "abandonne"].includes(m.statut)).length,
    mandat_signe: mandats.filter((m) => m.statut === "mandat_signe").length,
    en_vente: mandats.filter((m) => m.statut === "en_vente").length,
  };

  if (selected) {
    return (
      <MandatDetail
        mandat={selected}
        onBack={() => { setSelected(null); load(); }}
        onUpdate={async () => {
          const updated = await base44.entities.MandatVente.filter({ id: selected.id });
          setSelected(updated[0] || null);
        }}
      />
    );
  }

  if (showNew) {
    return (
      <MandatDetail
        mandat={null}
        onBack={() => { setShowNew(false); load(); }}
        onUpdate={async () => { setShowNew(false); load(); }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mandats & Estimations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pipeline de mise en vente — de la prise de contact au mandat signé</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setShowNew(true)} className="rounded-full gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Nouveau mandat
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", val: stats.total, color: "" },
          { label: "En cours", val: stats.actifs, color: "text-amber-600" },
          { label: "Mandats signés", val: stats.mandat_signe, color: "text-green-600" },
          { label: "En vente", val: stats.en_vente, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
            <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline view */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STEPS_ORDER.map((s) => {
          const count = mandats.filter((m) => m.statut === s).length;
          return (
            <div key={s} className="bg-white rounded-xl border border-border/50 p-3 text-center">
              <p className={`text-xl font-bold ${count > 0 ? "text-foreground" : "text-muted-foreground/30"}`}>{count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{STATUT_LABELS[s]}</p>
            </div>
          );
        })}
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
          <FileSignature className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium">Aucun mandat</p>
          <p className="text-xs text-muted-foreground mt-1">Créez votre premier dossier vendeur</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.map((m) => {
              const stepIdx = STEPS_ORDER.indexOf(m.statut);
              const pct = stepIdx >= 0 ? Math.round(((stepIdx + 1) / STEPS_ORDER.length) * 100) : 0;
              return (
                <button key={m.id} onClick={() => setSelected(m)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <FileSignature className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.vendeur_nom}</p>
                    <p className="text-xs text-muted-foreground">{m.bien_adresse || m.bien_ville || "Adresse non renseignée"}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full max-w-[100px]">
                        <div className="h-1.5 bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {m.prix_mandat && <p className="text-sm font-bold">{fmt(m.prix_mandat)}</p>}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[m.statut] || "bg-gray-100 text-gray-500"}`}>
                      {STATUT_LABELS[m.statut] || m.statut}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-border/30 bg-secondary/20">
            <p className="text-xs text-muted-foreground">{filtered.length} dossier{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}