import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Upload, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LocataireDocuments() {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const dossiers = await base44.entities.DossierLocatif.list("-created_date", 100);
      const found = dossiers.find(d =>
        d.locataire_selectionne?.email === me.email ||
        d.candidatures?.some(c => c.email === me.email && c.statut === "selectionne")
      );
      setDossier(found || null);
      setLoading(false);
    };
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !dossier || !uploadLabel) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newDoc = { id: Date.now(), libelle: uploadLabel, url: file_url, statut: "en_attente", uploaded_by: "locataire", date: new Date().toISOString() };
    await base44.entities.DossierLocatif.update(dossier.id, {
      documents: [...(dossier.documents || []), newDoc]
    });
    setDossier(prev => ({ ...prev, documents: [...(prev.documents || []), newDoc] }));
    setUploadLabel("");
    setUploading(false);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const docs = dossier?.documents || [];
  const docTypes = [
    { key: "bail", label: "Contrat de bail", url: dossier?.contrat_url },
    ...docs.map(d => ({ key: d.id, label: d.libelle, url: d.url, statut: d.statut, date: d.date })),
  ].filter(d => d.url);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Accédez à tous vos documents et téléchargez vos pièces justificatives</p>
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        {docTypes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun document disponible pour l'instant</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {docTypes.map((doc) => (
              <div key={doc.key} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{doc.label}</p>
                  {doc.date && <p className="text-xs text-muted-foreground">{new Date(doc.date).toLocaleDateString("fr-FR")}</p>}
                </div>
                {doc.statut === "en_attente" && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">En validation</span>
                )}
                {doc.statut === "valide" && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validé
                  </span>
                )}
                <a href={doc.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="rounded-full h-8 text-xs gap-1">
                    <Download className="w-3 h-3" /> Télécharger
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload section */}
      {dossier && (
        <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
          <p className="text-sm font-semibold flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Envoyer un document</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              placeholder="Nom du document (ex: Justificatif de domicile)"
              className="flex-1 h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
            />
            <label className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all ${uploadLabel ? "bg-primary text-white hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Choisir un fichier
              <input type="file" className="hidden" disabled={!uploadLabel || uploading} onChange={handleUpload} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Formats acceptés : PDF, JPG, PNG · Max 10 Mo</p>
        </div>
      )}
    </div>
  );
}