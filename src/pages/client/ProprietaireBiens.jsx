import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Home, Loader2, MapPin, TrendingUp, KeySquare, FolderOpen } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const STATUT_BIEN = {
  disponible: { label: "Disponible", color: "bg-blue-100 text-blue-700" },
  en_cours:   { label: "En cours",   color: "bg-amber-100 text-amber-700" },
  vendu:      { label: "Vendu",      color: "bg-slate-100 text-slate-600" },
  loue:       { label: "Loué",       color: "bg-green-100 text-green-700" },
};

export default function ProprietaireBiens() {
  const [biens, setBiens] = useState([]);        // entité Bien (CRM)
  const [properties, setProperties] = useState([]); // entité Property (portail)
  const [dossiers, setDossiers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();

      const [contacts, props, dossiersImmo, dossiersLocatifs] = await Promise.all([
        base44.entities.Contact.filter({ email: me.email }, "-created_date", 5),
        base44.entities.Property.filter({ owner_email: me.email }, "-created_date", 50),
        base44.entities.DossierImmobilier.list("-created_date", 200),
        base44.entities.DossierLocatif.list("-created_date", 100),
      ]);

      const myContact = contacts[0] || null;
      setProperties(props);

      // Biens CRM liés au contact
      let myBiens = [];
      if (myContact) {
        const allBiens = await base44.entities.Bien.list("-created_date", 300);
        myBiens = allBiens.filter(b => b.owner_id === myContact.id);
      }
      setBiens(myBiens);

      // Dossiers liés
      const bienIds = new Set(myBiens.map(b => b.id));
      const propIds = new Set(props.map(p => p.id));
      const myDossiers = dossiersImmo.filter(d =>
        (myContact && d.contact_ids?.includes(myContact.id)) ||
        (d.bien_id && bienIds.has(d.bien_id))
      );
      const myDossiersLocatifs = dossiersLocatifs.filter(d => propIds.has(d.property_id));
      setDossiers([...myDossiers, ...myDossiersLocatifs]);

      const firstBienId = myBiens[0]?.id || props[0]?.id || null;
      setSelected(firstBienId);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const allItems = [
    ...biens.map(b => ({ id: b.id, titre: b.titre, adresse: b.adresse, type: b.type, statut: b.statut, prix: b.prix, surface: b.surface, nb_pieces: b.nb_pieces, dpe: b.dpe, source: "bien" })),
    ...properties.map(p => ({ id: p.id, titre: p.title, adresse: p.address || p.city, type: p.transaction, statut: p.status, prix: p.price, surface: p.surface, nb_pieces: p.rooms, dpe: p.dpe, images: p.images, source: "property" })),
  ];

  const selectedItem = allItems.find(i => i.id === selected);
  const dossierLie = dossiers.find(d => d.bien_id === selected || d.property_id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes biens</h1>
        <p className="text-sm text-muted-foreground mt-1">{allItems.length} bien{allItems.length > 1 ? "s" : ""} en gestion</p>
      </div>

      {allItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-10 text-center space-y-3">
          <Home className="w-10 h-10 text-muted-foreground/20 mx-auto" />
          <p className="text-sm text-muted-foreground">Aucun bien associé à votre compte</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Liste */}
          <div className="space-y-2">
            {allItems.map((item) => {
              const statut = STATUT_BIEN[item.statut] || { label: item.statut, color: "bg-secondary text-muted-foreground" };
              return (
                <button key={item.id} onClick={() => setSelected(item.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selected === item.id ? "border-primary bg-primary/5" : "border-border/50 bg-white hover:border-primary/30"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{item.titre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statut.color}`}>{statut.label}</span>
                  </div>
                  {item.adresse && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{item.adresse}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-emerald-600">{item.prix ? fmt(item.prix) : "—"}{item.type === "location" ? "/m" : ""}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-muted-foreground ${item.type === "location" ? "bg-emerald-50" : "bg-blue-50"}`}>
                      {item.type === "location" ? "Location" : "Vente"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Détail */}
          {selectedItem && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-border/50 p-5">
                {selectedItem.images?.[0] && (
                  <img src={selectedItem.images[0]} alt="" className="w-full h-44 object-cover rounded-xl mb-4" />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{selectedItem.titre}</h2>
                    {selectedItem.adresse && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />{selectedItem.adresse}
                      </p>
                    )}
                  </div>
                  <div className={`p-2 rounded-xl flex-shrink-0 ${selectedItem.type === "location" ? "bg-emerald-50" : "bg-blue-50"}`}>
                    {selectedItem.type === "location"
                      ? <KeySquare className="w-4 h-4 text-emerald-600" />
                      : <TrendingUp className="w-4 h-4 text-blue-600" />}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {selectedItem.surface && (
                    <div className="bg-secondary/30 rounded-xl p-3 text-center">
                      <p className="text-sm font-bold">{selectedItem.surface}m²</p>
                      <p className="text-xs text-muted-foreground">Surface</p>
                    </div>
                  )}
                  {selectedItem.nb_pieces && (
                    <div className="bg-secondary/30 rounded-xl p-3 text-center">
                      <p className="text-sm font-bold">{selectedItem.nb_pieces}p</p>
                      <p className="text-xs text-muted-foreground">Pièces</p>
                    </div>
                  )}
                  {selectedItem.dpe && (
                    <div className="bg-secondary/30 rounded-xl p-3 text-center">
                      <p className="text-sm font-bold">{selectedItem.dpe}</p>
                      <p className="text-xs text-muted-foreground">DPE</p>
                    </div>
                  )}
                </div>
                {selectedItem.prix && (
                  <p className="text-xl font-bold text-emerald-600 mt-4">
                    {fmt(selectedItem.prix)}{selectedItem.type === "location" ? "/mois" : ""}
                  </p>
                )}
              </div>

              {/* Dossier lié */}
              {dossierLie && (
                <div className="bg-white rounded-2xl border border-border/50 p-5">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-600" /> Dossier associé
                  </p>
                  <div className="space-y-2 text-sm">
                    {dossierLie.titre && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dossier</span>
                        <span className="font-medium">{dossierLie.titre}</span>
                      </div>
                    )}
                    {(dossierLie.locataire_selectionne?.nom || dossierLie.statut) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{dossierLie.locataire_selectionne ? "Locataire" : "Statut"}</span>
                        <span className="font-medium">{dossierLie.locataire_selectionne?.nom || dossierLie.statut}</span>
                      </div>
                    )}
                    {dossierLie.loyer && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loyer</span>
                        <span className="font-medium">{fmt(dossierLie.loyer)}</span>
                      </div>
                    )}
                    {dossierLie.contact_ids && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contacts liés</span>
                        <span className="font-medium">{dossierLie.contact_ids.length}</span>
                      </div>
                    )}
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