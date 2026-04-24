import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarPlus, Calendar, MapPin, Download, Loader2, CheckCircle2, X } from "lucide-react";
import { Link } from "react-router-dom";

const STATUT_CFG = {
  planifie: { cls: "bg-blue-100 text-blue-700", label: "Planifié" },
  confirme: { cls: "bg-green-100 text-green-700", label: "Confirmé" },
  annule:   { cls: "bg-red-100 text-red-700", label: "Annulé" },
  realise:  { cls: "bg-gray-100 text-gray-600", label: "Réalisé" },
};

const fmtDT = iso => iso ? new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function exportICS(evs) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ImmoPilot//RDV//FR", "CALSCALE:GREGORIAN"];
  evs.forEach(e => {
    const dtstart = e.date_debut ? new Date(e.date_debut).toISOString().replace(/[-:]/g,"").replace(".000","") : "";
    lines.push("BEGIN:VEVENT", `UID:${e.id}@immopilot`, `SUMMARY:${e.titre}`);
    if (dtstart) lines.push(`DTSTART:${dtstart}`);
    if (e.lieu) lines.push(`LOCATION:${e.lieu}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rdv.ics"; a.click();
}

export default function TabRDV({ dossier }) {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const defDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours()+1)}:00`;
  const [visites, setVisites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "visite", date_debut: defDate, notes: "", lieu: dossier.bien_adresse || "" });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
    base44.entities.Evenement.filter({ dossier_locatif_id: dossier.id }).then(evs => { setVisites(evs); setLoading(false); });
  }, [dossier.id]);

  const creerRdv = async () => {
    if (!form.date_debut) return;
    setSaving(true);
    const end = new Date(form.date_debut); end.setHours(end.getHours() + 1);
    const date_fin = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}T${pad(end.getHours())}:00`;
    const TYPE_LABELS = { visite: "Visite", etat_des_lieux: "EDL", signature: "Signature", appel: "Appel" };
    const ev = await base44.entities.Evenement.create({
      titre: `${TYPE_LABELS[form.type] || "RDV"} — ${dossier.locataire_nom} · ${dossier.bien_titre}`,
      type: form.type, module: "location",
      date_debut: form.date_debut, date_fin,
      lieu: form.lieu || dossier.bien_adresse || "",
      contact_nom: dossier.locataire_nom || "",
      contact_email: dossier.locataire_email || "",
      bien_titre: dossier.bien_titre || "",
      bien_id: dossier.bien_id || "",
      dossier_locatif_id: dossier.id,
      statut: "planifie", rappel_24h: true, rappel_1h: true,
      ics_uid: `${Date.now()}@immopilot`,
      agent_email: currentUser?.email || "",
      agent_nom: currentUser?.full_name || "",
      notes: form.notes,
    });
    setVisites(p => [ev, ...p]);
    // Historiser la création du RDV dans le dossier
    const histEntry = { date: new Date().toISOString(), action: `RDV planifié : ${TYPE_LABELS[form.type] || "RDV"} le ${new Date(form.date_debut).toLocaleDateString("fr-FR")}`, auteur: currentUser?.full_name || "Agent", type: "rdv" };
    const hist = [...(dossier.historique || []), histEntry];
    await base44.entities.DossierLocatif.update(dossier.id, { historique: hist });
    setShowForm(false);
    setSaving(false);
  };

  const updateStatut = async (id, statut) => {
    await base44.entities.Evenement.update(id, { statut });
    setVisites(prev => prev.map(v => v.id === id ? { ...v, statut } : v));
  };

  const deleteRdv = async (id) => {
    await base44.entities.Evenement.delete(id);
    setVisites(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">📅 Rendez-vous ({visites.length})</p>
        <div className="flex gap-2">
          {visites.length > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1" onClick={() => exportICS(visites)}>
              <Download className="w-3 h-3" /> ICS
            </Button>
          )}
          <Button size="sm" className="h-8 text-xs rounded-full gap-1" onClick={() => setShowForm(s => !s)}>
            <CalendarPlus className="w-3 h-3" /> Planifier
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-border/50 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="visite">Visite</option>
                <option value="etat_des_lieux">État des lieux</option>
                <option value="signature">Signature</option>
                <option value="appel">Appel</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date & heure *</label>
              <Input type="datetime-local" value={form.date_debut} onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))} className="h-9 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Lieu</label>
            <Input value={form.lieu} onChange={e => setForm(p => ({ ...p, lieu: e.target.value }))} placeholder="Adresse…" className="h-9 rounded-xl text-sm" />
          </div>
          <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes internes…" className="h-9 rounded-xl text-sm" />
          <div className="flex gap-2">
            <Button className="flex-1 h-9 rounded-full gap-1.5 text-sm" onClick={creerRdv} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />}
              Créer le RDV
            </Button>
            <Button variant="outline" className="h-9 rounded-full text-sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
          <p className="text-[10px] text-primary flex items-center gap-1">
            ↗ Visible aussi dans <Link to="/admin/agenda" className="underline font-medium ml-0.5">l'Agenda global</Link>
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : visites.length === 0 ? (
        <div className="text-center py-10 bg-secondary/20 rounded-2xl">
          <Calendar className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun RDV planifié</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visites.sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut)).map(v => {
            const scfg = STATUT_CFG[v.statut] || STATUT_CFG.planifie;
            return (
              <div key={v.id} className="bg-white border border-border/50 rounded-2xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{v.titre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <Calendar className="w-3 h-3" />{fmtDT(v.date_debut)}
                      {v.lieu && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.lieu}</span>}
                    </p>
                    {v.notes && <p className="text-xs text-muted-foreground mt-1 italic">{v.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <select value={v.statut} onChange={e => updateStatut(v.id, e.target.value)}
                      className={`h-7 rounded-full px-2 text-[10px] font-semibold border-0 ${scfg.cls} cursor-pointer`}>
                      {Object.entries(STATUT_CFG).map(([k, cfg]) => <option key={k} value={k}>{cfg.label}</option>)}
                    </select>
                    <button onClick={() => deleteRdv(v.id)} className="p-1 hover:bg-red-50 rounded-full">
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}