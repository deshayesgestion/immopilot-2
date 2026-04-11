import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Banknote, Loader2 } from "lucide-react";

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function PaiementCard({ label, montant, description, paid, onToggle, loading }) {
  return (
    <div className={`border rounded-2xl p-4 transition-all ${paid ? "border-green-300 bg-green-50/30" : "border-border/50 bg-white"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${paid ? "bg-green-100" : "bg-secondary"}`}>
            <Banknote className={`w-4 h-4 ${paid ? "text-green-600" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="text-sm font-bold">{formatEuro(montant)}</p>
          {paid ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Payé
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-full">
              <Clock className="w-3 h-3" /> En attente
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          variant={paid ? "outline" : "default"}
          className={`rounded-full h-8 text-xs gap-1.5 ${paid ? "border-green-200 text-green-600 hover:bg-green-50" : "bg-primary"}`}
          onClick={onToggle}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : paid ? <CheckCircle2 className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {paid ? "Marquer non payé" : "Marquer comme payé"}
        </Button>
      </div>
    </div>
  );
}

export default function PaiementStep({ dossier, onUpdate }) {
  const paiements = dossier.paiements || [];
  const caution = paiements.find((p) => p.type === "caution") || { type: "caution", paid: false };
  const premierLoyer = paiements.find((p) => p.type === "premier_loyer") || { type: "premier_loyer", paid: false };

  const [cautionPaid, setCautionPaid] = useState(caution.paid);
  const [loyerPaid, setLoyerPaid] = useState(premierLoyer.paid);
  const [loading, setLoading] = useState(null);

  const allPaid = cautionPaid && loyerPaid;

  const toggle = async (type) => {
    setLoading(type);
    const newCaution = type === "caution" ? !cautionPaid : cautionPaid;
    const newLoyer = type === "premier_loyer" ? !loyerPaid : loyerPaid;

    if (type === "caution") setCautionPaid(newCaution);
    else setLoyerPaid(newLoyer);

    const newPaiements = [
      { type: "caution", paid: newCaution },
      { type: "premier_loyer", paid: newLoyer },
    ];

    const update = { paiements: newPaiements };

    if (newCaution && newLoyer) {
      const stepsCompleted = [...(dossier.steps_completed || [])];
      if (!stepsCompleted.includes(4)) stepsCompleted.push(4);
      update.steps_completed = stepsCompleted;
      update.current_step = Math.max(dossier.current_step || 1, 5);
    }

    await base44.entities.DossierLocatif.update(dossier.id, update);
    setLoading(null);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Paiements initiaux</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enregistrez la réception des paiements avant l'entrée dans les lieux
        </p>
      </div>

      <div className="space-y-3">
        <PaiementCard
          label="Dépôt de garantie (caution)"
          montant={dossier.depot_garantie}
          description="À percevoir avant remise des clés"
          paid={cautionPaid}
          onToggle={() => toggle("caution")}
          loading={loading === "caution"}
        />
        <PaiementCard
          label="Premier loyer"
          montant={dossier.loyer}
          description={`Loyer mensuel${dossier.charges ? ` + ${formatEuro(dossier.charges)} charges` : ""}`}
          paid={loyerPaid}
          onToggle={() => toggle("premier_loyer")}
          loading={loading === "premier_loyer"}
        />
      </div>

      {allPaid ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-700 font-medium">Tous les paiements reçus · Étape suivante débloquée</p>
        </div>
      ) : (
        <div className="bg-secondary/40 rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground text-center">
            {[!cautionPaid && "caution", !loyerPaid && "premier loyer"].filter(Boolean).join(" et ")} en attente
          </p>
        </div>
      )}
    </div>
  );
}