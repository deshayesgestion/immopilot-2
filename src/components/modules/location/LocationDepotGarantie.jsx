import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, CheckCircle2, Clock, AlertTriangle, Loader2, Minus, Plus, RefreshCw } from "lucide-react";

const STATUT_CFG = {
  a_percevoir:     { label: "À percevoir",       color: "bg-amber-100 text-amber-700" },
  percu:           { label: "Perçu",             color: "bg-blue-100 text-blue-700" },
  restitue_partiel:{ label: "Restitué partiel",  color: "bg-orange-100 text-orange-700" },
  restitue_total:  { label: "Restitué total",    color: "bg-green-100 text-green-700" },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function DepotCard({ dossier, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [retenue, setRetenue] = useState({ motif: "", montant: "" });
  const [saving, setSaving] = useState(false);

  const addRetenue = async () => {
    if (!retenue.montant || !retenue.motif) return;
    setSaving(true);
    const retenues = [...(dossier.depot_garantie_retenues || []), { motif: retenue.motif, montant: Number(retenue.montant) }];
    const totalRetenues = retenues.reduce((s, r) => s + r.montant, 0);
    const restitutionRestante = (dossier.depot_garantie_montant || 0) - totalRetenues;
    await base44.entities.DossierLocatif.update(dossier.id, {
      depot_garantie_retenues: retenues,
      depot_garantie_restitution_montant: Math.max(0, restitutionRestante),
      depot_garantie_statut: restitutionRestante <= 0 ? "restitue_total" : "restitue_partiel",
    });
    onUpdate({ ...dossier, depot_garantie_retenues: retenues, depot_garantie_restitution_montant: Math.max(0, restitutionRestante) });
    setRetenue({ motif: "", montant: "" });
    setSaving(false);
    setEditing(false);
  };

  const marquerPercu = async () => {
    await base44.entities.DossierLocatif.update(dossier.id, {
      depot_garantie_statut: "percu",
      depot_garantie_percu_date: new Date().toISOString().slice(0, 10),
    });
    onUpdate({ ...dossier, depot_garantie_statut: "percu" });
  };

  const totalRetenues = (dossier.depot_garantie_retenues || []).reduce((s, r) => s + r.montant, 0);
  const montantRestant = (dossier.depot_garantie_montant || 0) - totalRetenues;
  const statutCfg = STATUT_CFG[dossier.depot_garantie_statut] || STATUT_CFG.a_percevoir;

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{dossier.locataire_nom}</p>
          <p className="text-xs text-muted-foreground">{dossier.bien_titre || "—"}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statutCfg.color}`}>
          {statutCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-secondary/20 rounded-xl p-2.5">
          <p className="text-sm font-bold">{dossier.depot_garantie_montant?.toLocaleString("fr-FR") || 0} €</p>
          <p className="text-[10px] text-muted-foreground">Montant initial</p>
        </div>
        <div className="bg-red-50 rounded-xl p-2.5">
          <p className="text-sm font-bold text-red-600">{totalRetenues.toLocaleString("fr-FR")} €</p>
          <p className="text-[10px] text-muted-foreground">Retenues</p>
        </div>
        <div className={`rounded-xl p-2.5 ${montantRestant > 0 ? "bg-green-50" : "bg-secondary/20"}`}>
          <p className={`text-sm font-bold ${montantRestant > 0 ? "text-green-600" : "text-muted-foreground"}`}>
            {montantRestant.toLocaleString("fr-FR")} €
          </p>
          <p className="text-[10px] text-muted-foreground">À restituer</p>
        </div>
      </div>

      {/* Retenues existantes */}
      {(dossier.depot_garantie_retenues || []).length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Retenues appliquées</p>
          {dossier.depot_garantie_retenues.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 bg-red-50 rounded-lg">
              <span>{r.motif}</span>
              <span className="font-bold text-red-600">-{r.montant?.toLocaleString("fr-FR")} €</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {dossier.depot_garantie_statut === "a_percevoir" && (
          <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs bg-blue-500 hover:bg-blue-600"
            onClick={marquerPercu}>
            <CheckCircle2 className="w-3 h-3" /> Marquer perçu
          </Button>
        )}
        {dossier.depot_garantie_statut === "percu" && (
          <Button size="sm" variant="outline" className="rounded-full gap-1.5 h-8 text-xs"
            onClick={() => setEditing(!editing)}>
            <Minus className="w-3 h-3" /> Ajouter retenue
          </Button>
        )}
      </div>

      {editing && (
        <div className="bg-secondary/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold">Nouvelle retenue</p>
          <Input value={retenue.motif} onChange={e => setRetenue(p => ({ ...p, motif: e.target.value }))}
            placeholder="Motif (ex: Dégradation peinture)" className="h-8 rounded-xl text-xs" />
          <div className="flex gap-2">
            <Input type="number" value={retenue.montant} onChange={e => setRetenue(p => ({ ...p, montant: e.target.value }))}
              placeholder="Montant (€)" className="h-8 rounded-xl text-xs flex-1" />
            <Button size="sm" className="h-8 rounded-full text-xs gap-1" onClick={addRetenue} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Ajouter
            </Button>
          </div>
        </div>
      )}

      {dossier.depot_garantie_percu_date && (
        <p className="text-[10px] text-muted-foreground">Perçu le {fmt(dossier.depot_garantie_percu_date)}</p>
      )}
    </div>
  );
}

export default function LocationDepotGarantie() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.DossierLocatif.list("-created_date", 200);
    setDossiers(all.filter(d => d.depot_garantie_montant > 0 || d.etape !== "candidature"));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (updated) => setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));

  const filtered = dossiers.filter(d => filter === "all" || d.depot_garantie_statut === filter);

  const stats = {
    total: dossiers.reduce((s, d) => s + (d.depot_garantie_montant || 0), 0),
    percus: dossiers.filter(d => ["percu", "restitue_partiel", "restitue_total"].includes(d.depot_garantie_statut)).length,
    aPercevoir: dossiers.filter(d => d.depot_garantie_statut === "a_percevoir").length,
    totalPercu: dossiers.filter(d => ["percu", "restitue_partiel"].includes(d.depot_garantie_statut)).reduce((s, d) => s + (d.depot_garantie_montant || 0), 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total DG collecté", value: `${stats.totalPercu.toLocaleString("fr-FR")} €`, color: "text-blue-600" },
          { label: "DG en attente", value: stats.aPercevoir, color: "text-amber-600" },
          { label: "DG perçus", value: stats.percus, color: "text-emerald-600" },
          { label: "Montant total engagé", value: `${stats.total.toLocaleString("fr-FR")} €`, color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[["all", "Tous"], ["a_percevoir", "À percevoir"], ["percu", "Perçus"], ["restitue_partiel", "Partiel"], ["restitue_total", "Restitués"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                filter === v ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"
              }`}>{l}</button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="rounded-full h-8 text-xs gap-1.5" onClick={load}>
          <RefreshCw className="w-3 h-3" /> Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-12 text-center">
          <Shield className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun dépôt de garantie trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(d => <DepotCard key={d.id} dossier={d} onUpdate={update} />)}
        </div>
      )}
    </div>
  );
}