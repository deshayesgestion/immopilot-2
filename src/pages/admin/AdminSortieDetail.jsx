import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Home, User, Euro, Calendar, Plus, CheckCircle2, Trash2 } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const STATUTS = [
  { value: "ouvert", label: "Ouvert", color: "bg-amber-100 text-amber-700" },
  { value: "edl_planifie", label: "EDL planifié", color: "bg-blue-100 text-blue-700" },
  { value: "edl_realise", label: "EDL réalisé", color: "bg-purple-100 text-purple-700" },
  { value: "restitution_caution", label: "Restitution caution", color: "bg-orange-100 text-orange-700" },
];
// "cloture" is a terminal state only reachable via explicit button
const ALL_STATUTS = [...STATUTS, { value: "cloture", label: "Clôturé", color: "bg-gray-100 text-gray-500" }];

export default function AdminSortieDetail() {
  const { id } = useParams();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Retenue form
  const [addingRetenue, setAddingRetenue] = useState(false);
  const [retenue, setRetenue] = useState({ motif: "", montant: "" });

  // Note
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = () => {
    base44.entities.DossierSortie.filter({ id })
      .then((res) => setDossier(res[0] || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatut = async (statut) => {
    setSaving(true);
    await base44.entities.DossierSortie.update(dossier.id, { statut });
    setSaving(false);
    load();
  };

  const addRetenue = async () => {
    const updated = [...(dossier.retenues || []), { id: Date.now(), ...retenue, montant: Number(retenue.montant) }];
    await base44.entities.DossierSortie.update(dossier.id, { retenues: updated });
    setRetenue({ motif: "", montant: "" });
    setAddingRetenue(false);
    load();
  };

  const removeRetenue = async (rid) => {
    const updated = (dossier.retenues || []).filter((r) => r.id !== rid);
    await base44.entities.DossierSortie.update(dossier.id, { retenues: updated });
    load();
  };

  const saveDateSortie = async (val) => {
    await base44.entities.DossierSortie.update(dossier.id, { date_sortie_effective: val });
    load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    const hist = [...(dossier.historique || []), { id: Date.now(), content: note, date: new Date().toISOString() }];
    await base44.entities.DossierSortie.update(dossier.id, { historique: hist });
    setNote("");
    setSavingNote(false);
    load();
  };

  const cloturerDossier = async () => {
    if (!window.confirm("Clôturer définitivement ce dossier de sortie ?")) return;
    setSaving(true);
    await base44.entities.DossierSortie.update(dossier.id, {
      statut: "cloture",
      date_sortie_effective: dossier.date_sortie_effective || new Date().toISOString(),
    });
    setSaving(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!dossier) return (
    <div className="text-center py-24">
      <p className="text-sm text-muted-foreground">Dossier introuvable.</p>
      <Link to="/admin/sortie" className="text-primary text-sm hover:underline mt-2 inline-block">← Retour</Link>
    </div>
  );

  const statutObj = ALL_STATUTS.find((s) => s.value === dossier.statut) || ALL_STATUTS[0];
  const totalRetenues = (dossier.retenues || []).reduce((s, r) => s + Number(r.montant || 0), 0);
  const restitution = Math.max(0, (dossier.depot_garantie || 0) - totalRetenues);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/sortie" className="mt-1 p-1.5 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">Sortie — {dossier.property_title}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statutObj.color}`}>{statutObj.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{dossier.property_address} · Réf. {dossier.reference}</p>
        </div>
        {dossier.statut !== "cloture" && (
          <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 bg-gray-600 hover:bg-gray-700 flex-shrink-0" onClick={cloturerDossier} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Clôturer
          </Button>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <User className="w-4 h-4 text-blue-500 mb-2" />
          <p className="text-sm font-semibold">{dossier.locataire?.nom || "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{dossier.locataire?.email || "—"}</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Euro className="w-4 h-4 text-green-500 mb-2" />
          <p className="text-sm font-semibold">{fmt(dossier.depot_garantie)}</p>
          <p className="text-xs text-muted-foreground">Caution</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Calendar className="w-4 h-4 text-purple-500 mb-2" />
          <p className="text-sm font-semibold">{dossier.date_sortie_prevue ? new Date(dossier.date_sortie_prevue).toLocaleDateString("fr-FR") : "—"}</p>
          <p className="text-xs text-muted-foreground">Sortie prévue</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Home className="w-4 h-4 text-amber-500 mb-2" />
          <p className="text-sm font-semibold">{fmt(restitution)}</p>
          <p className="text-xs text-muted-foreground">À restituer</p>
        </div>
      </div>

      {/* Statut workflow */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
        <p className="text-sm font-semibold mb-4">Avancement</p>
        <div className="flex items-center gap-2 flex-wrap">
          {ALL_STATUTS.map((s, i) => {
            const idx = ALL_STATUTS.findIndex((x) => x.value === dossier.statut);
            const isDone = i < idx;
            const isCurrent = i === idx;
            const isNext = i === idx + 1;
            const isCloture = s.value === "cloture";
            // Only allow clicking the next step (not cloture, handled by button)
            const clickable = isNext && !isCloture && !saving;
            return (
              <button
                key={s.value}
                onClick={() => clickable && updateStatut(s.value)}
                disabled={!clickable}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isCurrent ? s.color + " border-current" :
                  isDone ? "bg-green-50 text-green-700 border-green-200" :
                  isNext && !isCloture ? "bg-secondary/50 text-foreground border-border cursor-pointer hover:border-primary" :
                  "bg-secondary/20 text-muted-foreground border-transparent cursor-default opacity-50"
                }`}
              >
                {isDone && <CheckCircle2 className="w-3 h-3" />}
                {s.label}
                {isNext && !isCloture && <span className="text-[10px] opacity-60">→</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date sortie effective */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
        <p className="text-sm font-semibold mb-3">Date de sortie effective</p>
        <Input
          type="date"
          defaultValue={dossier.date_sortie_effective ? dossier.date_sortie_effective.substring(0, 10) : ""}
          onChange={(e) => saveDateSortie(e.target.value)}
          className="h-9 max-w-xs text-sm"
        />
      </div>

      {/* Retenues sur caution */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold">Retenues sur caution</p>
            <p className="text-xs text-muted-foreground mt-0.5">Caution : {fmt(dossier.depot_garantie)} · Retenues : {fmt(totalRetenues)} · <strong>À restituer : {fmt(restitution)}</strong></p>
          </div>
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={() => setAddingRetenue(true)}>
            <Plus className="w-3 h-3" /> Ajouter
          </Button>
        </div>

        {addingRetenue && (
          <div className="border border-border/50 rounded-xl p-4 space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Motif</label>
                <Input value={retenue.motif} onChange={(e) => setRetenue({ ...retenue, motif: e.target.value })} className="h-8 text-sm" placeholder="ex: Dégradation salle de bain" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Montant (€)</label>
                <Input type="number" value={retenue.montant} onChange={(e) => setRetenue({ ...retenue, montant: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setAddingRetenue(false)}>Annuler</Button>
              <Button size="sm" className="rounded-full h-8 text-xs" onClick={addRetenue} disabled={!retenue.motif || !retenue.montant}>Ajouter</Button>
            </div>
          </div>
        )}

        {(dossier.retenues || []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune retenue</p>
        ) : (
          <div className="space-y-2">
            {dossier.retenues.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm">{r.motif}</p>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-red-600">- {fmt(r.montant)}</p>
                  <button onClick={() => removeRetenue(r.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique / Notes */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
        <p className="text-sm font-semibold mb-4">Notes & Historique</p>
        <div className="space-y-2 mb-4">
          <Textarea
            placeholder="Ajouter une note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm resize-none min-h-[70px] rounded-xl"
          />
          <Button size="sm" className="rounded-full h-8 text-xs gap-1.5" onClick={addNote} disabled={savingNote || !note.trim()}>
            {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {[...(dossier.historique || [])].reverse().map((m) => (
            <div key={m.id} className="bg-secondary/20 border border-border/30 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{new Date(m.date).toLocaleString("fr-FR")}</p>
              <p className="text-sm">{m.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}