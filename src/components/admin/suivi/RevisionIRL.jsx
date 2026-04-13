import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp, CheckCircle2, ChevronDown, ChevronUp, History } from "lucide-react";

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n || 0);

// IRL reference values (INSEE - indices de référence des loyers)
// Format: { trimestre: "T4 2024", indice: 143.46 }
const IRL_HISTORY = [
  { trimestre: "T4 2024", indice: 143.46 },
  { trimestre: "T3 2024", indice: 143.26 },
  { trimestre: "T2 2024", indice: 142.93 },
  { trimestre: "T1 2024", indice: 142.07 },
  { trimestre: "T4 2023", indice: 141.48 },
  { trimestre: "T3 2023", indice: 140.59 },
  { trimestre: "T2 2023", indice: 139.56 },
  { trimestre: "T1 2023", indice: 138.63 },
  { trimestre: "T4 2022", indice: 136.27 },
  { trimestre: "T3 2022", indice: 135.84 },
  { trimestre: "T2 2022", indice: 133.93 },
  { trimestre: "T1 2022", indice: 132.14 },
];

export default function RevisionIRL({ dossier, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [irlBase, setIrlBase] = useState(IRL_HISTORY[4].trimestre); // T4 2023 par défaut
  const [irlNouvel, setIrlNouvel] = useState(IRL_HISTORY[0].trimestre); // T4 2024
  const [nouveauLoyer, setNouveauLoyer] = useState(null);
  const [editLoyer, setEditLoyer] = useState("");
  const [editCharges, setEditCharges] = useState("");
  const [editAssurance, setEditAssurance] = useState("");
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState(false);

  const revisionsHistorique = dossier.revisions_irl || [];

  const calcBase = IRL_HISTORY.find((i) => i.trimestre === irlBase);
  const calcNouvel = IRL_HISTORY.find((i) => i.trimestre === irlNouvel);

  const calculer = () => {
    if (!calcBase || !calcNouvel) return;
    const ratio = calcNouvel.indice / calcBase.indice;
    const loyerActuel = dossier.loyer || 0;
    const chargesActuelles = dossier.charges || 0;

    const loyerRevise = Math.round(loyerActuel * ratio * 100) / 100;
    const chargesRevisees = Math.round(chargesActuelles * ratio * 100) / 100;

    setNouveauLoyer({
      ratio,
      loyerActuel,
      chargesActuelles,
      loyerRevise,
      chargesRevisees,
      variation: ((ratio - 1) * 100).toFixed(2),
    });
    setEditLoyer(loyerRevise.toString());
    setEditCharges(chargesRevisees.toString());
    setEditAssurance(dossier.assurance?.toString() || "");
    setValidated(false);
  };

  const valider = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const revision = {
      id: Date.now(),
      date: now,
      irl_base: { trimestre: irlBase, indice: calcBase?.indice },
      irl_nouvel: { trimestre: irlNouvel, indice: calcNouvel?.indice },
      ratio: nouveauLoyer?.ratio,
      ancien_loyer: nouveauLoyer?.loyerActuel,
      ancien_charges: nouveauLoyer?.chargesActuelles,
      nouveau_loyer: Number(editLoyer),
      nouveau_charges: Number(editCharges),
      nouveau_assurance: editAssurance ? Number(editAssurance) : undefined,
    };

    const revisions = [...revisionsHistorique, revision];
    await base44.entities.DossierLocatif.update(dossier.id, {
      loyer: Number(editLoyer),
      charges: Number(editCharges),
      ...(editAssurance ? { assurance: Number(editAssurance) } : {}),
      revisions_irl: revisions,
    });

    setSaving(false);
    setValidated(true);
    setNouveauLoyer(null);
    setOpen(false);
    onUpdate();
  };

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Révision de loyer IRL</p>
          {revisionsHistorique.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {revisionsHistorique.length} révision{revisionsHistorique.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-5 space-y-5 bg-white">
          {/* Loyer actuel */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-secondary/20 rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Loyer actuel</p>
              <p className="text-sm font-bold">{formatEuro(dossier.loyer)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Charges actuelles</p>
              <p className="text-sm font-bold">{formatEuro(dossier.charges)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total mensuel</p>
              <p className="text-sm font-bold text-primary">{formatEuro((dossier.loyer || 0) + (dossier.charges || 0))}</p>
            </div>
          </div>

          {/* IRL selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                IRL de référence (base)
              </label>
              <select
                value={irlBase}
                onChange={(e) => { setIrlBase(e.target.value); setNouveauLoyer(null); }}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
              >
                {IRL_HISTORY.map((i) => (
                  <option key={i.trimestre} value={i.trimestre}>{i.trimestre} — {i.indice}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">Indice au moment de la signature du bail</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                Nouvel IRL (révision)
              </label>
              <select
                value={irlNouvel}
                onChange={(e) => { setIrlNouvel(e.target.value); setNouveauLoyer(null); }}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
              >
                {IRL_HISTORY.map((i) => (
                  <option key={i.trimestre} value={i.trimestre}>{i.trimestre} — {i.indice}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">Dernier indice connu (source INSEE)</p>
            </div>
          </div>

          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={calculer}>
            <TrendingUp className="w-3 h-3" /> Calculer la révision
          </Button>

          {/* Résultat du calcul */}
          {nouveauLoyer && (
            <div className="border border-primary/30 bg-primary/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">Proposition de révision</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${parseFloat(nouveauLoyer.variation) > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {nouveauLoyer.variation > 0 ? "+" : ""}{nouveauLoyer.variation}%
                </span>
              </div>

              {/* Calcul détaillé */}
              <div className="bg-white/70 rounded-lg p-3 text-xs font-mono space-y-1 text-muted-foreground">
                <p>Formule : Loyer × (IRL nouvel / IRL base)</p>
                <p>= {formatEuro(nouveauLoyer.loyerActuel)} × ({calcNouvel?.indice} / {calcBase?.indice})</p>
                <p>= {formatEuro(nouveauLoyer.loyerActuel)} × {nouveauLoyer.ratio.toFixed(6)}</p>
                <p className="font-bold text-foreground">= {formatEuro(nouveauLoyer.loyerRevise)}</p>
              </div>

              {/* Champs éditables pour validation */}
              <p className="text-xs text-muted-foreground font-medium">Ajustez si nécessaire avant validation :</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nouveau loyer (€)</label>
                  <Input type="number" step="0.01" value={editLoyer} onChange={(e) => setEditLoyer(e.target.value)} className="h-8 text-sm font-semibold" />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Proposé : {formatEuro(nouveauLoyer.loyerRevise)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nouvelles charges (€)</label>
                  <Input type="number" step="0.01" value={editCharges} onChange={(e) => setEditCharges(e.target.value)} className="h-8 text-sm" />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Proposé : {formatEuro(nouveauLoyer.chargesRevisees)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Assurance (€)</label>
                  <Input type="number" step="0.01" value={editAssurance} onChange={(e) => setEditAssurance(e.target.value)} placeholder="Optionnel" className="h-8 text-sm" />
                </div>
              </div>

              {/* Nouveau total */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground">Nouveau total mensuel</p>
                <p className="text-base font-bold text-primary">
                  {formatEuro(Number(editLoyer || 0) + Number(editCharges || 0) + Number(editAssurance || 0))}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button size="sm" variant="outline" className="rounded-full h-9 text-xs" onClick={() => setNouveauLoyer(null)}>
                  Annuler
                </Button>
                <Button size="sm" className="rounded-full h-9 text-xs gap-1.5 flex-1" onClick={valider} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Valider et appliquer la révision
                </Button>
              </div>
            </div>
          )}

          {/* Historique des révisions */}
          {revisionsHistorique.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory((p) => !p)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                Historique des révisions ({revisionsHistorique.length})
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showHistory && (
                <div className="mt-3 space-y-2">
                  {[...revisionsHistorique].reverse().map((rev) => (
                    <div key={rev.id} className="border border-border/40 rounded-xl p-3 bg-secondary/10 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{new Date(rev.date).toLocaleDateString("fr-FR")}</p>
                        <span className="text-muted-foreground">
                          {((rev.ratio - 1) * 100).toFixed(2)}% de variation
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-muted-foreground">
                          <p>Base : {rev.irl_base?.trimestre} ({rev.irl_base?.indice})</p>
                          <p>Nouvel : {rev.irl_nouvel?.trimestre} ({rev.irl_nouvel?.indice})</p>
                        </div>
                        <div>
                          <p>Loyer : <span className="text-muted-foreground line-through mr-1">{formatEuro(rev.ancien_loyer)}</span> <span className="font-semibold">{formatEuro(rev.nouveau_loyer)}</span></p>
                          <p>Charges : <span className="text-muted-foreground line-through mr-1">{formatEuro(rev.ancien_charges)}</span> <span className="font-semibold">{formatEuro(rev.nouveau_charges)}</span></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}