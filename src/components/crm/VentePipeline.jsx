import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User, Home, Star, Phone, Plus } from "lucide-react";

const COLUMNS = [
  { id: "nouveau", label: "Nouveau", color: "bg-blue-500", light: "bg-blue-50 border-blue-200" },
  { id: "contacte", label: "Contacté", color: "bg-yellow-500", light: "bg-yellow-50 border-yellow-200" },
  { id: "qualifie", label: "Qualifié", color: "bg-green-500", light: "bg-green-50 border-green-200" },
  { id: "perdu", label: "Perdu", color: "bg-red-400", light: "bg-red-50 border-red-200" },
];

function ScoreBar({ score }) {
  const pct = score ?? null;
  const color = pct == null ? "bg-secondary" : pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: pct != null ? `${pct}%` : "0%" }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-6 text-right">{pct ?? "—"}</span>
    </div>
  );
}

function LeadCard({ lead, contact, bien, onLeadClick, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onClick={() => onLeadClick(lead)}
      className="bg-white rounded-xl border border-border/60 p-3 shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{contact?.nom || "Contact inconnu"}</p>
            {contact?.telephone && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" />{contact.telephone}
              </p>
            )}
          </div>
        </div>
        {lead.score != null && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-bold text-amber-600">{lead.score}</span>
          </div>
        )}
      </div>

      {bien && (
        <div className="mt-2 flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1">
          <Home className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{bien.titre}</span>
          {bien.prix && <span className="text-xs font-medium ml-auto flex-shrink-0">{bien.prix.toLocaleString("fr-FR")} €</span>}
        </div>
      )}

      <ScoreBar score={lead.score} />

      {lead.source && (
        <p className="text-[10px] text-muted-foreground mt-1.5">Source : {lead.source}</p>
      )}
    </div>
  );
}

export default function VentePipeline({ leads, contactMap, bienMap, onLeadClick, onLeadsChange }) {
  const [dragging, setDragging] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, lead) => {
    setDragging(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, colId) => {
    e.preventDefault();
    if (!dragging || dragging.statut === colId) return;
    const updated = { ...dragging, statut: colId };
    onLeadsChange(prev => prev.map(l => l.id === dragging.id ? updated : l));
    await base44.entities.Lead.update(dragging.id, { statut: colId });
    setDragging(null);
    setDragOverCol(null);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const colLeads = leads.filter(l => l.statut === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-2xl border-2 p-3 min-h-[400px] transition-all ${
              dragOverCol === col.id ? col.light : "bg-secondary/20 border-transparent"
            }`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <span className="text-xs font-bold uppercase tracking-wide text-foreground">{col.label}</span>
              </div>
              <span className="text-xs bg-white border border-border/50 rounded-full px-2 py-0.5 font-semibold">
                {colLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {colLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  contact={contactMap[lead.contact_id]}
                  bien={bienMap[lead.bien_id]}
                  onLeadClick={onLeadClick}
                  onDragStart={handleDragStart}
                />
              ))}
              {colLeads.length === 0 && (
                <div className="py-8 text-center text-muted-foreground/40 text-xs">
                  Déposer un lead ici
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}