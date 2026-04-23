import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X, Clock,
  MapPin, User, Home, Phone, FileSignature, CheckSquare,
  Loader2, Download, AlertTriangle, Filter, Sparkles
} from "lucide-react";

const TYPE_CONFIG = {
  visite:         { label: "Visite",       color: "bg-blue-500",   light: "bg-blue-50 border-blue-200 text-blue-700",    dot: "bg-blue-500" },
  etat_des_lieux: { label: "État des lieux",color: "bg-teal-500",  light: "bg-teal-50 border-teal-200 text-teal-700",    dot: "bg-teal-500" },
  appel:          { label: "Appel",        color: "bg-purple-500", light: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500" },
  signature:      { label: "Signature",    color: "bg-green-500",  light: "bg-green-50 border-green-200 text-green-700",  dot: "bg-green-500" },
  tache:          { label: "Tâche",        color: "bg-amber-500",  light: "bg-amber-50 border-amber-200 text-amber-700",  dot: "bg-amber-500" },
  autre:          { label: "Autre",        color: "bg-gray-400",   light: "bg-gray-50 border-gray-200 text-gray-600",    dot: "bg-gray-400" },
};

const MODULE_CONFIG = {
  location: { label: "Location", badge: "bg-emerald-100 text-emerald-700" },
  vente:    { label: "Vente",    badge: "bg-blue-100 text-blue-700" },
  general:  { label: "Général",  badge: "bg-gray-100 text-gray-600" },
};

const STATUT_CONFIG = {
  planifie:  { label: "Planifié",  badge: "bg-blue-100 text-blue-700" },
  confirme:  { label: "Confirmé",  badge: "bg-green-100 text-green-700" },
  annule:    { label: "Annulé",    badge: "bg-red-100 text-red-700" },
  realise:   { label: "Réalisé",   badge: "bg-gray-100 text-gray-600" },
};

const TYPE_ICONS = {
  visite: Home, etat_des_lieux: CheckSquare, appel: Phone, signature: FileSignature, tache: CheckSquare, autre: Calendar,
};

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
const fmtMonth = (d) => d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
const fmtWeek = (d) => {
  const mon = getMonday(d);
  const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
  return `${mon.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} – ${sun.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;
};

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── ICS Export ────────────────────────────────────────────────────────────
function exportICS(evenements) {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ImmoPilot//Agenda//FR",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
  ];
  evenements.forEach(e => {
    const uid = e.ics_uid || `${e.id}@immopilot`;
    const dtstart = e.date_debut ? new Date(e.date_debut).toISOString().replace(/[-:]/g, "").replace(".000", "") : "";
    const dtend = e.date_fin ? new Date(e.date_fin).toISOString().replace(/[-:]/g, "").replace(".000", "") : dtstart;
    const desc = [e.description, e.contact_nom && `Client: ${e.contact_nom}`, e.bien_titre && `Bien: ${e.bien_titre}`].filter(Boolean).join("\\n");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`SUMMARY:${e.titre}`);
    if (dtstart) lines.push(`DTSTART:${dtstart}`);
    if (dtend) lines.push(`DTEND:${dtend}`);
    if (e.lieu) lines.push(`LOCATION:${e.lieu}`);
    if (desc) lines.push(`DESCRIPTION:${desc}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "agenda-immopilot.ics"; a.click();
  URL.revokeObjectURL(url);
}

// ── Event form modal ──────────────────────────────────────────────────────
function EvenementModal({ evenement, onClose, onSaved, currentUser }) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const defaultDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours()+1)}:00`;

  const [form, setForm] = useState(evenement || {
    titre: "", type: "visite", date_debut: defaultDate, date_fin: "",
    lieu: "", description: "", contact_nom: "", contact_email: "", contact_telephone: "",
    bien_titre: "", statut: "planifie", rappel_24h: true, rappel_1h: true,
    agent_email: currentUser?.email || "", agent_nom: currentUser?.full_name || "",
  });
  const [saving, setSaving] = useState(false);
  const [conflits, setConflits] = useState([]);

  // Auto compute end (+1h)
  useEffect(() => {
    if (form.date_debut && !form.date_fin) {
      const d = new Date(form.date_debut);
      d.setHours(d.getHours() + 1);
      const pad = (n) => String(n).padStart(2, "0");
      setForm(p => ({ ...p, date_fin: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }));
    }
  }, [form.date_debut]);

  const save = async () => {
    if (!form.titre.trim() || !form.date_debut) return;
    setSaving(true);
    const data = { ...form, ics_uid: form.ics_uid || `${Date.now()}@immopilot` };
    if (evenement?.id) {
      await base44.entities.Evenement.update(evenement.id, data);
    } else {
      await base44.entities.Evenement.create(data);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const TypeIcon = TYPE_ICONS[form.type] || Calendar;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50 z-10">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">{evenement?.id ? "Modifier l'événement" : "Nouvel événement"}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Titre *</label>
            <Input value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
              placeholder="Ex: Visite appartement Dupont" className="h-9 rounded-xl text-sm" autoFocus />
          </div>

          {/* Type buttons */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                const Icon = TYPE_ICONS[k];
                return (
                  <button key={k} onClick={() => setForm(p => ({ ...p, type: k }))}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.type === k ? `${v.light} border-current` : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                    }`}>
                    <Icon className="w-3 h-3" />{v.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Début *</label>
              <Input type="datetime-local" value={form.date_debut}
                onChange={e => setForm(p => ({ ...p, date_debut: e.target.value, date_fin: "" }))}
                className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fin</label>
              <Input type="datetime-local" value={form.date_fin}
                onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))}
                className="h-9 rounded-xl text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Lieu / Adresse</label>
            <Input value={form.lieu} onChange={e => setForm(p => ({ ...p, lieu: e.target.value }))}
              placeholder="Adresse du bien ou lieu de RDV" className="h-9 rounded-xl text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><User className="w-3 h-3" /> Client</label>
              <Input value={form.contact_nom} onChange={e => setForm(p => ({ ...p, contact_nom: e.target.value }))}
                placeholder="Nom du client" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Home className="w-3 h-3" /> Bien</label>
              <Input value={form.bien_titre} onChange={e => setForm(p => ({ ...p, bien_titre: e.target.value }))}
                placeholder="Titre du bien" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tél. client</label>
              <Input value={form.contact_telephone} onChange={e => setForm(p => ({ ...p, contact_telephone: e.target.value }))}
                placeholder="06..." className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
              <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="Notes internes…" className="rounded-xl text-sm resize-none" />
          </div>

          {/* Rappels */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-medium">Rappels :</label>
            {[["rappel_24h", "24h avant"], ["rappel_1h", "1h avant"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.checked }))}
                  className="rounded" />
                {l}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full flex-1 h-9 text-sm" onClick={save} disabled={saving || !form.titre.trim()}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : evenement?.id ? "Sauvegarder" : "Créer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Event detail popover ──────────────────────────────────────────────────
function EvenementDetail({ ev, onClose, onEdit, onDelete }) {
  const config = TYPE_CONFIG[ev.type] || TYPE_CONFIG.autre;
  const statut = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.planifie;
  const Icon = TYPE_ICONS[ev.type] || Calendar;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.Evenement.delete(ev.id);
    setDeleting(false);
    onDelete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`rounded-t-2xl px-5 py-4 ${config.light} border-b`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <p className="font-semibold text-sm">{ev.titre}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground/60 hover:text-muted-foreground flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statut.badge}`}>{statut.label}</span>
            {ev.module && ev.module !== "general" && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${MODULE_CONFIG[ev.module]?.badge || ""}`}>
                {MODULE_CONFIG[ev.module]?.label}
              </span>
            )}
          </div>
        </div>
        <div className="p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span>{fmt(ev.date_debut)} · {fmtTime(ev.date_debut)}{ev.date_fin ? ` → ${fmtTime(ev.date_fin)}` : ""}</span>
          </div>
          {ev.lieu && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span>{ev.lieu}</span>
            </div>
          )}
          {ev.contact_nom && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span>{ev.contact_nom}{ev.contact_telephone && ` · ${ev.contact_telephone}`}</span>
            </div>
          )}
          {ev.bien_titre && (
            <div className="flex items-center gap-2 text-sm">
              <Home className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span>{ev.bien_titre}</span>
            </div>
          )}
          {ev.agent_nom && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3 h-3 flex-shrink-0" />
              <span>Agent : {ev.agent_nom}</span>
            </div>
          )}
          {ev.description && (
            <p className="text-xs text-muted-foreground bg-secondary/20 rounded-xl p-3">{ev.description}</p>
          )}
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <Button size="sm" variant="outline" className="rounded-full flex-1 h-8 text-xs" onClick={() => { onClose(); onEdit(ev); }}>Modifier</Button>
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs text-red-600 hover:bg-red-50 border-red-200" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Supprimer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────
function MonthView({ date, evenements, onDayClick, onEventClick }) {
  const year = date.getFullYear(), month = date.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const today = new Date();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border/50">
        {DAYS.map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-border/20 bg-secondary/10" />;
          const dayEvs = evenements.filter(e => e.date_debut && isSameDay(new Date(e.date_debut), d));
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()}
              className={`min-h-[100px] border-b border-r border-border/20 p-1.5 cursor-pointer hover:bg-secondary/20 transition-colors ${isToday ? "bg-primary/5" : ""}`}
              onClick={() => onDayClick(d)}>
              <p className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-primary text-white" : "text-foreground"}`}>
                {d.getDate()}
              </p>
              <div className="space-y-0.5">
                {dayEvs.slice(0, 3).map(e => {
                  const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.autre;
                  return (
                    <div key={e.id} onClick={ev => { ev.stopPropagation(); onEventClick(e); }}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${cfg.light} border`}>
                      {fmtTime(e.date_debut)} {e.titre}
                    </div>
                  );
                })}
                {dayEvs.length > 3 && <p className="text-[10px] text-muted-foreground pl-1">+{dayEvs.length - 3} autres</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────
function WeekView({ date, evenements, onEventClick, onSlotClick }) {
  const monday = getMonday(date);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return d;
  });
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8h-20h
  const today = new Date();
  const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="overflow-auto">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-border/50 sticky top-0 bg-white z-10">
        <div className="py-2" />
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className="py-2 text-center">
              <p className="text-xs text-muted-foreground">{DAYS_SHORT[i]}</p>
              <p className={`text-sm font-semibold mx-auto w-8 h-8 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-white" : ""}`}>
                {d.getDate()}
              </p>
            </div>
          );
        })}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-8">
        {/* Hours */}
        <div className="border-r border-border/30">
          {hours.map(h => (
            <div key={h} className="h-14 flex items-start justify-end pr-2 pt-1">
              <span className="text-[10px] text-muted-foreground">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
        {/* Day columns */}
        {days.map((d, di) => (
          <div key={di} className="border-r border-border/20 relative">
            {hours.map(h => (
              <div key={h} className="h-14 border-b border-border/10 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => {
                  const dt = new Date(d);
                  dt.setHours(h, 0, 0, 0);
                  onSlotClick(dt);
                }} />
            ))}
            {/* Events overlay */}
            {evenements.filter(e => e.date_debut && isSameDay(new Date(e.date_debut), d)).map(e => {
              const start = new Date(e.date_debut);
              const end = e.date_fin ? new Date(e.date_fin) : new Date(start.getTime() + 60 * 60 * 1000);
              const top = ((start.getHours() - 8) * 56 + start.getMinutes() / 60 * 56);
              const height = Math.max(((end - start) / (1000 * 60 * 60)) * 56, 24);
              const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.autre;
              if (start.getHours() < 8 || start.getHours() > 20) return null;
              return (
                <div key={e.id} onClick={ev => { ev.stopPropagation(); onEventClick(e); }}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  className={`absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden z-10 ${cfg.light} border`}>
                  <p className="text-[10px] font-semibold leading-tight truncate">{e.titre}</p>
                  <p className="text-[9px] text-muted-foreground">{fmtTime(e.date_debut)}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────
function DayView({ date, evenements, onEventClick, onSlotClick }) {
  const dayEvs = evenements.filter(e => e.date_debut && isSameDay(new Date(e.date_debut), date))
    .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="flex gap-4 overflow-auto p-4">
      {/* Timeline */}
      <div className="flex-1">
        <div className="relative">
          {hours.map(h => (
            <div key={h} className="flex items-start gap-3 h-16 border-b border-border/10">
              <span className="text-[10px] text-muted-foreground w-10 text-right flex-shrink-0 mt-1">{String(h).padStart(2, "0")}:00</span>
              <div className="flex-1 h-full cursor-pointer hover:bg-secondary/20 rounded-lg transition-colors"
                onClick={() => {
                  const dt = new Date(date);
                  dt.setHours(h, 0, 0, 0);
                  onSlotClick(dt);
                }} />
            </div>
          ))}
          {/* Events */}
          {dayEvs.filter(e => {
            const h = new Date(e.date_debut).getHours();
            return h >= 8 && h <= 20;
          }).map(e => {
            const start = new Date(e.date_debut);
            const end = e.date_fin ? new Date(e.date_fin) : new Date(start.getTime() + 60 * 60 * 1000);
            const top = ((start.getHours() - 8) * 64 + start.getMinutes() / 60 * 64);
            const height = Math.max(((end - start) / (1000 * 60 * 60)) * 64, 32);
            const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.autre;
            const Icon = TYPE_ICONS[e.type] || Calendar;
            return (
              <div key={e.id} onClick={() => onEventClick(e)}
                style={{ position: "absolute", top: `${top}px`, height: `${height}px`, left: "52px", right: "8px" }}
                className={`rounded-xl px-3 py-2 cursor-pointer hover:shadow-sm transition-all overflow-hidden ${cfg.light} border-l-4 ${cfg.color.replace("bg-", "border-")}`}>
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <p className="text-xs font-semibold truncate">{e.titre}</p>
                </div>
                {height > 40 && <p className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(e.date_debut)} → {fmtTime(e.date_fin || "")} · {e.contact_nom || e.lieu || ""}</p>}
              </div>
            );
          })}
        </div>
      </div>
      {/* Side list */}
      <div className="w-64 flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        {dayEvs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Aucun événement</p>
        ) : dayEvs.map(e => {
          const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.autre;
          const Icon = TYPE_ICONS[e.type] || Calendar;
          return (
            <div key={e.id} onClick={() => onEventClick(e)}
              className={`rounded-xl px-3 py-2.5 cursor-pointer hover:shadow-sm transition-all ${cfg.light} border`}>
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <p className="text-xs font-semibold flex-1 truncate">{e.titre}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{fmtTime(e.date_debut)}{e.date_fin ? ` → ${fmtTime(e.date_fin)}` : ""}</p>
              {e.contact_nom && <p className="text-[10px] text-muted-foreground">{e.contact_nom}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function AdminAgenda() {
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("mois"); // mois | semaine | jour
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editEv, setEditEv] = useState(null);
  const [selectedEv, setSelectedEv] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [presetDate, setPresetDate] = useState(null);

  const load = async () => {
    const [evs, me] = await Promise.all([
      base44.entities.Evenement.list("-date_debut", 500),
      base44.auth.me(),
    ]);
    setEvenements(evs);
    setCurrentUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => evenements.filter(e => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterAgent !== "all" && e.agent_email !== filterAgent) return false;
    if (filterModule !== "all" && (e.module || "general") !== filterModule) return false;
    return true;
  }), [evenements, filterType, filterAgent, filterModule]);

  const agents = useMemo(() => {
    const map = new Map();
    evenements.forEach(e => { if (e.agent_email && e.agent_nom) map.set(e.agent_email, e.agent_nom); });
    return Array.from(map.entries());
  }, [evenements]);

  // Conflits: events on same time same agent
  const conflits = useMemo(() => {
    const list = [];
    const actifs = evenements.filter(e => e.statut !== "annule" && e.date_debut && e.date_fin);
    for (let i = 0; i < actifs.length; i++) {
      for (let j = i + 1; j < actifs.length; j++) {
        const a = actifs[i], b = actifs[j];
        if (a.agent_email && a.agent_email === b.agent_email) {
          const aStart = new Date(a.date_debut), aEnd = new Date(a.date_fin);
          const bStart = new Date(b.date_debut), bEnd = new Date(b.date_fin);
          if (aStart < bEnd && aEnd > bStart) list.push({ a, b });
        }
      }
    }
    return list;
  }, [evenements]);

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (viewMode === "mois") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "semaine") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const openNew = (date) => {
    setPresetDate(date);
    setEditEv(date ? {
      date_debut: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}T${String(date.getHours()).padStart(2,"0")}:00`,
    } : null);
    setShowModal(true);
  };

  const headerLabel = viewMode === "mois" ? fmtMonth(currentDate)
    : viewMode === "semaine" ? fmtWeek(currentDate)
    : currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Upcoming today
  const today = new Date();
  const todayEvs = evenements.filter(e => e.date_debut && isSameDay(new Date(e.date_debut), today) && e.statut !== "annule")
    .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visites, appels, signatures et tâches</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {conflits.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-semibold text-red-700">{conflits.length} conflit{conflits.length > 1 ? "s" : ""}</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={() => exportICS(evenements)}>
            <Download className="w-3.5 h-3.5" /> Export ICS
          </Button>
          <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={() => openNew(null)}>
            <Plus className="w-3.5 h-3.5" /> Nouvel événement
          </Button>
        </div>
      </div>

      {/* Today strip */}
      {todayEvs.length > 0 && (
        <div className="bg-white rounded-2xl border border-primary/20 px-5 py-3.5">
          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Aujourd'hui · {todayEvs.length} événement{todayEvs.length > 1 ? "s" : ""}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {todayEvs.map(e => {
              const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.autre;
              const Icon = TYPE_ICONS[e.type] || Calendar;
              return (
                <div key={e.id} onClick={() => setSelectedEv(e)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer hover:shadow-sm transition-all flex-shrink-0 ${cfg.light}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">{e.titre}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtTime(e.date_debut)}{e.contact_nom ? ` · ${e.contact_nom}` : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-border/50 p-3 flex items-center gap-3 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-xs font-medium rounded-full hover:bg-secondary/60 transition-colors">
            Aujourd'hui
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold ml-2 capitalize">{headerLabel}</span>
        </div>

        <div className="flex-1" />

        {/* View mode */}
        <div className="flex gap-1 bg-secondary/40 rounded-xl p-0.5">
          {["jour", "semaine", "mois"].map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                viewMode === v ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>{v}</button>
          ))}
        </div>

        {/* Filters */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="h-8 rounded-full border border-input bg-white px-3 text-xs">
          <option value="all">Tous types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
          className="h-8 rounded-full border border-input bg-white px-3 text-xs">
          <option value="all">Tous modules</option>
          <option value="location">Location</option>
          <option value="vente">Vente</option>
          <option value="general">Général</option>
        </select>
        {agents.length > 1 && (
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="h-8 rounded-full border border-input bg-white px-3 text-xs">
            <option value="all">Tous agents</option>
            {agents.map(([email, nom]) => <option key={email} value={email}>{nom}</option>)}
          </select>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : viewMode === "mois" ? (
          <MonthView date={currentDate} evenements={filtered}
            onDayClick={d => { setCurrentDate(d); setViewMode("jour"); }}
            onEventClick={e => setSelectedEv(e)} />
        ) : viewMode === "semaine" ? (
          <WeekView date={currentDate} evenements={filtered}
            onEventClick={e => setSelectedEv(e)}
            onSlotClick={d => openNew(d)} />
        ) : (
          <DayView date={currentDate} evenements={filtered}
            onEventClick={e => setSelectedEv(e)}
            onSlotClick={d => openNew(d)} />
        )}
      </div>

      {/* Sync banner */}
      <div className="bg-gradient-to-r from-secondary/40 to-accent rounded-2xl border border-border/50 px-5 py-4 flex items-center gap-4">
        <Calendar className="w-8 h-8 text-primary/40 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Synchronisation calendriers externes</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Google Calendar, Apple Calendar (iCloud) et autres via ICS/CalDAV — connexion disponible prochainement.
            En attendant, exportez vos événements en ICS.
          </p>
        </div>
        <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5 flex-shrink-0" onClick={() => exportICS(evenements)}>
          <Download className="w-3.5 h-3.5" /> Export ICS
        </Button>
      </div>

      {/* Modals */}
      {showModal && (
        <EvenementModal
          evenement={editEv}
          currentUser={currentUser}
          onClose={() => { setShowModal(false); setEditEv(null); }}
          onSaved={load}
        />
      )}
      {selectedEv && (
        <EvenementDetail
          ev={selectedEv}
          onClose={() => setSelectedEv(null)}
          onEdit={e => { setEditEv(e); setShowModal(true); setSelectedEv(null); }}
          onDelete={load}
        />
      )}
    </div>
  );
}