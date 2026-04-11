import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Loader2, CheckCircle2, Home, User, FileText,
  CreditCard, ClipboardCheck, Key, Users
} from "lucide-react";
import CandidatureStep from "../../components/admin/attribution/CandidatureStep";
import ValidationStep from "../../components/admin/attribution/ValidationStep";

const STEPS = [
  { id: 1, label: "Candidatures", icon: Users, desc: "Collecte et gestion des candidats" },
  { id: 2, label: "Validation", icon: CheckCircle2, desc: "Vérification des dossiers et scoring" },
  { id: 3, label: "Bail", icon: FileText, desc: "Rédaction et signature du bail" },
  { id: 4, label: "Paiement", icon: CreditCard, desc: "Dépôt de garantie et premier loyer" },
  { id: 5, label: "État des lieux", icon: ClipboardCheck, desc: "Réalisation de l'état des lieux d'entrée" },
  { id: 6, label: "Entrée locataire", icon: Key, desc: "Remise des clés et finalisation" },
];

const STATUT_OPTIONS = [
  { value: "en_cours", label: "En cours" },
  { value: "en_attente", label: "En attente" },
  { value: "termine", label: "Terminé" },
  { value: "archive", label: "Archivé" },
];

const STATUT_COLORS = {
  en_cours: "bg-amber-100 text-amber-700",
  en_attente: "bg-gray-100 text-gray-500",
  termine: "bg-green-100 text-green-700",
  archive: "bg-gray-100 text-gray-400",
};

function StepContent({ step, dossier, onUpdate }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const isCompleted = (dossier.steps_completed || []).includes(step.id);
  const isCurrent = dossier.current_step === step.id;

  const markComplete = async () => {
    setSaving(true);
    const stepsCompleted = [...(dossier.steps_completed || [])];
    if (!stepsCompleted.includes(step.id)) stepsCompleted.push(step.id);
    const nextStep = Math.min(step.id + 1, STEPS.length);
    await base44.entities.DossierLocatif.update(dossier.id, {
      steps_completed: stepsCompleted,
      current_step: Math.max(dossier.current_step || 1, nextStep),
    });
    setSaving(false);
    onUpdate();
  };

  const Icon = step.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{step.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
        </div>
        {isCompleted ? (
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Complété
          </span>
        ) : isCurrent ? (
          <Button size="sm" className="rounded-full gap-1.5 text-xs h-8" onClick={markComplete} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Marquer complété
          </Button>
        ) : null}
      </div>

      {/* Step-specific placeholders */}
      {step.id === 1 && (
        <CandidatureStep dossier={dossier} onUpdate={onUpdate} />
      )}
      {step.id === 2 && (
        <ValidationStep dossier={dossier} onUpdate={onUpdate} />
      )}
      {step.id === 3 && (
        <div className="bg-secondary/40 rounded-xl p-4 text-xs text-muted-foreground text-center">
          La génération et signature du bail seront disponibles ici.
        </div>
      )}
      {step.id === 4 && (
        <div className="bg-secondary/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Loyer</span>
            <span className="font-semibold">{dossier.loyer || 0} €/mois</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Charges</span>
            <span className="font-semibold">{dossier.charges || 0} €/mois</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Dépôt de garantie</span>
            <span className="font-semibold">{dossier.depot_garantie || 0} €</span>
          </div>
        </div>
      )}
      {step.id === 5 && (
        <div className="bg-secondary/40 rounded-xl p-4 text-xs text-muted-foreground text-center">
          L'état des lieux d'entrée sera réalisé et enregistré ici.
        </div>
      )}
      {step.id === 6 && (
        <div className="bg-secondary/40 rounded-xl p-4 text-xs text-muted-foreground text-center">
          Remise des clés et finalisation de l'entrée du locataire.
        </div>
      )}

      {/* Notes */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">Notes (étape {step.id})</p>
        <Textarea
          placeholder="Ajoutez des notes pour cette étape..."
          className="text-sm rounded-xl resize-none min-h-[70px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  );
}

export default function AdminAttributionDetail() {
  const { id } = useParams();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [editingStatut, setEditingStatut] = useState(false);

  const load = () => {
    base44.entities.DossierLocatif.filter({ id })
      .then((res) => {
        const d = res[0];
        setDossier(d);
        if (d) setActiveStep(d.current_step || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatut = async (val) => {
    await base44.entities.DossierLocatif.update(dossier.id, { statut: val });
    setEditingStatut(false);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="text-center py-24">
        <p className="text-sm text-muted-foreground">Dossier introuvable.</p>
        <Link to="/admin/attribution" className="text-primary text-sm hover:underline mt-2 inline-block">← Retour</Link>
      </div>
    );
  }

  const statut = STATUT_COLORS[dossier.statut] || STATUT_COLORS.en_cours;
  const completedCount = (dossier.steps_completed || []).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/attribution" className="mt-1 p-1.5 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{dossier.property_title || "Dossier d'attribution"}</h1>
            <div onClick={() => setEditingStatut(true)} className="cursor-pointer">
              {editingStatut ? (
                <Select value={dossier.statut} onValueChange={updateStatut}>
                  <SelectTrigger className="h-7 text-xs rounded-full w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 ${statut}`}>
                  {STATUT_OPTIONS.find((o) => o.value === dossier.statut)?.label || "En cours"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>{dossier.reference}</span>
            {dossier.agent_name && <span>· 👤 {dossier.agent_name}</span>}
            {dossier.loyer > 0 && <span>· 💶 {dossier.loyer}€/mois</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-primary">{Math.round(completedCount / STEPS.length * 100)}%</p>
          <p className="text-xs text-muted-foreground">{completedCount}/{STEPS.length} étapes</p>
        </div>
      </div>

      {/* Global progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.round(completedCount / STEPS.length * 100)}%` }}
        />
      </div>

      <div className="flex gap-6">
        {/* Steps sidebar */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {STEPS.map((step) => {
            const isCompleted = (dossier.steps_completed || []).includes(step.id);
            const isCurrent = dossier.current_step === step.id;
            const isActive = activeStep === step.id;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive ? "bg-white shadow-sm border border-border/50" : "hover:bg-secondary/30"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? "bg-green-500" : isCurrent ? "bg-primary" : "bg-secondary"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className={`text-xs font-bold ${isCurrent ? "text-white" : "text-muted-foreground"}`}>{step.id}</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 bg-white rounded-2xl border border-border/50 shadow-sm p-6">
          {(() => {
            const step = STEPS.find((s) => s.id === activeStep);
            return step ? <StepContent step={step} dossier={dossier} onUpdate={load} /> : null;
          })()}
        </div>
      </div>
    </div>
  );
}