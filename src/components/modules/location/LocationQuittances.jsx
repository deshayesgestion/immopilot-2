import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  FileText, Plus, CheckCircle2, Clock, AlertTriangle, Euro,
  Loader2, Send, RefreshCw, Sparkles, Download
} from "lucide-react";

const STATUT_CFG = {
  en_attente: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  paye:       { label: "Payé",       color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  en_retard:  { label: "En retard",  color: "bg-red-100 text-red-700",     icon: AlertTriangle },
  impaye:     { label: "Impayé",     color: "bg-red-200 text-red-800",     icon: AlertTriangle },
};

const MOIS_LABELS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function getMoisLabel(mois) {
  if (!mois) return "—";
  const [y, m] = mois.split("-");
  return `${MOIS_LABELS[parseInt(m) - 1]} ${y}`;
}

export default function LocationQuittances() {
  const [quittances, setQuittances] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterStatut, setFilterStatut] = useState("all");
  const [relancing, setRelancing] = useState(null);

  const load = async () => {
    setLoading(true);
    const [q, d] = await Promise.all([
      base44.entities.Quittance.list("-created_date", 300),
      base44.entities.DossierLocatif.list("-created_date", 100),
    ]);
    setQuittances(q);
    setDossiers(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const dossierMap = Object.fromEntries(dossiers.map(d => [d.id, d]));

  const filtered = quittances.filter(q => filterStatut === "all" || q.statut === filterStatut);

  const stats = {
    total: quittances.length,
    payes: quittances.filter(q => q.statut === "paye").length,
    enAttente: quittances.filter(q => q.statut === "en_attente").length,
    retards: quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye").length,
    totalEncaisse: quittances.filter(q => q.statut === "paye").reduce((s, q) => s + (q.montant_total || 0), 0),
    totalAttendu: quittances.reduce((s, q) => s + (q.montant_total || 0), 0),
  };

  const genererMoisCourant = async () => {
    setGenerating(true);
    const now = new Date();
    const mois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const moisLabel = getMoisLabel(mois);
    const dossierActifs = dossiers.filter(d => d.etape === "vie_bail" && d.bail_statut !== "termine");
    let created = 0;
    for (const d of dossierActifs) {
      const exists = quittances.find(q => q.dossier_locatif_id === d.id && q.mois === mois);
      if (!exists) {
        const total = (d.loyer_mensuel || 0) + (d.charges_mensuelle || 0);
        const echeance = new Date(now.getFullYear(), now.getMonth(), 5).toISOString().slice(0, 10);
        await base44.entities.Quittance.create({
          dossier_locatif_id: d.id,
          contact_id: d.contact_id,
          bien_id: d.bien_id,
          locataire_nom: d.locataire_nom,
          bien_titre: d.bien_titre,
          bien_adresse: d.bien_adresse,
          mois, moisLabel,
          montant_loyer: d.loyer_mensuel || 0,
          montant_charges: d.charges_mensuelle || 0,
          montant_total: total,
          statut: "en_attente",
          date_echeance: echeance,
        });
        created++;
      }
    }
    await load();
    setGenerating(false);
    if (created === 0) alert("Toutes les quittances du mois sont déjà générées.");
    else alert(`${created} quittance${created > 1 ? "s" : ""} générée${created > 1 ? "s" : ""} pour ${moisLabel}.`);
  };

  const marquerPaye = async (q) => {
    await base44.entities.Quittance.update(q.id, {
      statut: "paye",
      date_paiement: new Date().toISOString().slice(0, 10),
    });
    setQuittances(prev => prev.map(x => x.id === q.id ? { ...x, statut: "paye", date_paiement: new Date().toISOString().slice(0, 10) } : x));
  };

  const relanceIA = async (q) => {
    setRelancing(q.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Rédige un message de relance courtois pour impayé de loyer.
Locataire: ${q.locataire_nom}
Bien: ${q.bien_titre}
Mois: ${getMoisLabel(q.mois)}
Montant: ${q.montant_total}€
Relance n°${(q.relance_count || 0) + 1}
Retourne JSON: { message: string (SMS/email court, max 200 chars) }`,
      response_json_schema: { type: "object", properties: { message: { type: "string" } } }
    });
    if (result?.message) {
      await base44.entities.Quittance.update(q.id, {
        statut: (q.relance_count || 0) >= 2 ? "impaye" : "en_retard",
        relance_count: (q.relance_count || 0) + 1,
        relance_date: new Date().toISOString(),
      });
      setQuittances(prev => prev.map(x => x.id === q.id ? {
        ...x, statut: (q.relance_count || 0) >= 2 ? "impaye" : "en_retard",
        relance_count: (q.relance_count || 0) + 1
      } : x));
      alert(`Message de relance IA :\n\n${result.message}`);
    }
    setRelancing(null);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total quittances", value: stats.total, color: "text-foreground" },
          { label: "Encaissé", value: `${stats.totalEncaisse.toLocaleString("fr-FR")} €`, color: "text-emerald-600" },
          { label: "En attente", value: stats.enAttente, color: "text-amber-600" },
          { label: "Retards/Impayés", value: stats.retards, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {["all", "en_attente", "paye", "en_retard", "impaye"].map(s => (
            <button key={s} onClick={() => setFilterStatut(s)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                filterStatut === s ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"
              }`}>
              {s === "all" ? "Toutes" : STATUT_CFG[s]?.label || s}
              {s === "en_retard" || s === "impaye" ? ` (${quittances.filter(q => q.statut === s).length})` : ""}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={load}>
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={genererMoisCourant} disabled={generating}>
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Générer mois courant
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune quittance</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Générez les quittances du mois courant</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.map(q => {
              const cfg = STATUT_CFG[q.statut] || STATUT_CFG.en_attente;
              const Icon = cfg.icon;
              return (
                <div key={q.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/10 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{q.locataire_nom || "—"}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getMoisLabel(q.mois)} · {q.bien_titre || "—"} · {q.montant_total?.toLocaleString("fr-FR")} €
                    </p>
                    {q.statut === "en_retard" || q.statut === "impaye" ? (
                      <p className="text-[10px] text-red-600">Échéance: {fmt(q.date_echeance)} · Relance {q.relance_count || 0}×</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {q.statut === "en_attente" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-green-300 text-green-700"
                        onClick={() => marquerPaye(q)}>
                        <CheckCircle2 className="w-3 h-3" /> Payé
                      </Button>
                    )}
                    {(q.statut === "en_attente" || q.statut === "en_retard") && (
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1"
                        onClick={() => relanceIA(q)} disabled={relancing === q.id}>
                        {relancing === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Relancer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}