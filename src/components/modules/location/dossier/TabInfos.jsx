import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, History } from "lucide-react";

const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const fmtISO = d => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function TabInfos({ dossier, onSave }) {
  const [form, setForm] = useState({
    locataire_nom: dossier.locataire_nom || "",
    locataire_email: dossier.locataire_email || "",
    locataire_telephone: dossier.locataire_telephone || "",
    proprietaire_nom: dossier.proprietaire_nom || "",
    loyer_mensuel: dossier.loyer_mensuel || 0,
    charges_mensuelle: dossier.charges_mensuelle || 0,
    depot_garantie_montant: dossier.depot_garantie_montant || 0,
    notes: dossier.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    await base44.entities.DossierLocatif.update(dossier.id, form);
    onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Locataire */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Locataire</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Nom complet</label>
            <Input value={form.locataire_nom} onChange={e => set("locataire_nom", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <Input type="email" value={form.locataire_email} onChange={e => set("locataire_email", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Téléphone</label>
            <Input value={form.locataire_telephone} onChange={e => set("locataire_telephone", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Propriétaire</label>
            <Input value={form.proprietaire_nom} onChange={e => set("proprietaire_nom", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
        </div>
      </div>

      {/* Finances */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Finances</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Loyer (€/mois)</label>
            <Input type="number" value={form.loyer_mensuel} onChange={e => set("loyer_mensuel", Number(e.target.value))} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Charges (€)</label>
            <Input type="number" value={form.charges_mensuelle} onChange={e => set("charges_mensuelle", Number(e.target.value))} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dépôt (€)</label>
            <Input type="number" value={form.depot_garantie_montant} onChange={e => set("depot_garantie_montant", Number(e.target.value))} className="h-9 rounded-xl text-sm" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notes internes</label>
        <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Notes agents…" className="rounded-xl text-sm resize-none" />
      </div>

      <Button className="rounded-full gap-2 w-full" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Enregistrer
      </Button>

      {/* Historique */}
      {dossier.historique?.length > 0 && (
        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2"><History className="w-3.5 h-3.5" /> Historique</p>
          <div className="space-y-1.5">
            {[...(dossier.historique || [])].reverse().slice(0, 10).map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground/50 flex-shrink-0 whitespace-nowrap">{fmtISO(h.date)}</span>
                <span className="text-muted-foreground">{h.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}