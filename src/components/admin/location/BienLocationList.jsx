import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Pencil, Trash2, Globe, Plus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CONFIG = {
  disponible: { label: "Disponible", color: "bg-green-100 text-green-700" },
  sous_compromis: { label: "En cours d'attribution", color: "bg-amber-100 text-amber-700" },
  loue: { label: "Occupé", color: "bg-blue-100 text-blue-700" },
  vendu: { label: "Archivé", color: "bg-gray-100 text-gray-500" },
};

const TYPE_LABELS = {
  appartement: "Appt.",
  maison: "Maison",
  bureau: "Bureau",
  local_commercial: "Local",
  terrain: "Terrain",
};

const DPE_COLORS = {
  A: "bg-green-500", B: "bg-green-400", C: "bg-lime-400",
  D: "bg-yellow-400", E: "bg-orange-400", F: "bg-orange-500", G: "bg-red-500",
};

export default function BienLocationList({ biens, onEdit, onRefresh }) {
  const [expanded, setExpanded] = useState(null);
  const [histEdit, setHistEdit] = useState({});
  const [savingHist, setSavingHist] = useState(null);
  const [creatingAttrib, setCreatingAttrib] = useState(null);

  const formatPrice = (p) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce bien ?")) return;
    await base44.entities.Property.delete(id);
    onRefresh();
  };

  const toggleExpand = (id) => setExpanded((prev) => (prev === id ? null : id));

  const saveHistory = async (bien) => {
    setSavingHist(bien.id);
    await base44.entities.Property.update(bien.id, { historique: histEdit[bien.id] ?? bien.historique ?? "" });
    setSavingHist(null);
    onRefresh();
  };

  const createAttribution = async (bien) => {
    setCreatingAttrib(bien.id);
    await base44.entities.DossierLocatif.create({
      property_id: bien.id,
      property_title: bien.title,
      property_address: [bien.address, bien.city, bien.postal_code].filter(Boolean).join(", "),
      agent_email: bien.agent_email || "",
      agent_name: bien.agent_name || "",
      loyer: bien.price || 0,
      charges: bien.monthly_charges || 0,
      depot_garantie: bien.deposit || 0,
      statut: "en_cours",
      current_step: 1,
      steps_completed: [],
      reference: `ATTR-${Date.now()}`,
    });
    setCreatingAttrib(null);
    alert(`Attribution créée pour "${bien.title}"`);
  };

  const toggleStatus = async (bien) => {
    const newStatus = bien.status === "disponible" ? "sous_compromis" : "disponible";
    await base44.entities.Property.update(bien.id, { status: newStatus });
    onRefresh();
  };

  if (!biens.length) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
          <Globe className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium">Aucun bien en location</p>
        <p className="text-xs text-muted-foreground mt-1">Créez votre premier bien pour commencer</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border/50">
        {["Bien", "Type", "Loyer", "DPE", "Statut", ""].map((h, i) => (
          <p key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
        ))}
      </div>

      <div className="divide-y divide-border/30">
        {biens.map((bien) => {
          const status = STATUS_CONFIG[bien.status] || STATUS_CONFIG.disponible;
          const isExpanded = expanded === bien.id;
          return (
            <div key={bien.id}>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                {/* Bien */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{bien.title}</p>
                    {bien.featured && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">★</span>}
                    {bien.publish_site && <Globe className="w-3 h-3 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {[bien.city, bien.postal_code].filter(Boolean).join(" ")}
                    {bien.agent_name ? ` · ${bien.agent_name}` : bien.agent_email ? ` · ${bien.agent_email}` : ""}
                  </p>
                </div>

                {/* Type */}
                <p className="text-sm text-muted-foreground">{TYPE_LABELS[bien.type] || bien.type}</p>

                {/* Loyer */}
                <div>
                  <p className="text-sm font-semibold">{formatPrice(bien.price)}<span className="text-xs font-normal text-muted-foreground">/mois</span></p>
                  {bien.monthly_charges > 0 && <p className="text-xs text-muted-foreground">+{formatPrice(bien.monthly_charges)} ch.</p>}
                </div>

                {/* DPE */}
                {bien.dpe ? (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${DPE_COLORS[bien.dpe] || "bg-gray-300"}`}>
                      {bien.dpe}
                    </div>
                    <span className="text-xs text-muted-foreground">{bien.ges ? `GES ${bien.ges}` : ""}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/40">—</p>
                )}

                {/* Statut */}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${status.color}`}>{status.label}</span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleExpand(bien.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Historique & Attribution">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => onEdit(bien)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Modifier">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(bien.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="px-5 pb-4 bg-secondary/10 border-t border-border/30 space-y-4">
                  <div className="pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historique du logement</p>
                    <Textarea
                      placeholder="Notes internes, historique des locataires, travaux effectués..."
                      className="text-sm rounded-xl resize-none min-h-[80px] bg-white"
                      value={histEdit[bien.id] ?? bien.historique ?? ""}
                      onChange={(e) => setHistEdit((p) => ({ ...p, [bien.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => saveHistory(bien)}
                      className="mt-2 text-xs text-primary hover:underline font-medium"
                      disabled={savingHist === bien.id}
                    >
                      {savingHist === bien.id ? "Enregistrement..." : "Enregistrer l'historique"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-2 text-xs h-8"
                      onClick={() => createAttribution(bien)}
                      disabled={creatingAttrib === bien.id}
                    >
                      {creatingAttrib === bien.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Créer une attribution
                    </Button>
                    <span className="text-xs text-muted-foreground">Crée un dossier locatif lié à ce bien</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}