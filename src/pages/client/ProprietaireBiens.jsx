import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Home, Loader2, CreditCard, FileText, AlertTriangle } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function ProprietaireBiens() {
  const [properties, setProperties] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const props = await base44.entities.Property.filter({ owner_email: me.email }, "-created_date", 50);
      setProperties(props);
      const dos = await base44.entities.DossierLocatif.list("-created_date", 100);
      setDossiers(dos.filter(d => props.some(p => p.id === d.property_id)));
      if (props.length > 0) setSelected(props[0].id);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const prop = properties.find(p => p.id === selected);
  const dossier = dossiers.find(d => d.property_id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes biens</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion de vos propriétés</p>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
          <Home className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun bien associé à votre compte</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Property list */}
          <div className="space-y-2">
            {properties.map((p) => (
              <button key={p.id} onClick={() => setSelected(p.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selected === p.id ? "border-primary bg-primary/5" : "border-border/50 bg-white hover:border-primary/30"}`}>
                <p className="text-sm font-semibold truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.city} · {p.surface}m²</p>
                <p className="text-sm font-bold text-emerald-600 mt-1">{fmt(p.price)}{p.transaction === "location" ? "/m" : ""}</p>
              </button>
            ))}
          </div>

          {/* Detail */}
          {prop && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-border/50 p-5">
                {prop.images?.[0] && (
                  <img src={prop.images[0]} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
                )}
                <h2 className="text-lg font-bold">{prop.title}</h2>
                <p className="text-sm text-muted-foreground">{prop.address || prop.city}</p>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-secondary/30 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold">{prop.surface}m²</p>
                    <p className="text-xs text-muted-foreground">Surface</p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold">{prop.rooms}p</p>
                    <p className="text-xs text-muted-foreground">Pièces</p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold">{prop.dpe || "—"}</p>
                    <p className="text-xs text-muted-foreground">DPE</p>
                  </div>
                </div>
              </div>

              {dossier && (
                <div className="bg-white rounded-2xl border border-border/50 p-5">
                  <p className="text-sm font-semibold mb-3">Dossier locatif actif</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Locataire</span>
                      <span className="font-medium">{dossier.locataire_selectionne?.nom || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loyer</span>
                      <span className="font-medium">{fmt(dossier.loyer)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paiements</span>
                      <span className="font-medium">{(dossier.paiements || []).length} enregistrés</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Incidents</span>
                      <span className="font-medium">{(dossier.incidents || []).filter(i => i.statut !== "resolu").length} ouverts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}