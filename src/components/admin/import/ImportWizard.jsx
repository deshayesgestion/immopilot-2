import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Download, FileText, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter
  const first = lines[0];
  const delimiter = first.includes(";") ? ";" : ",";

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === delimiter && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = parseLine(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });

  return { headers, rows };
}

function validateRow(row, mapping, fields) {
  const errors = [];
  const requiredFields = fields.filter(f => f.required);
  for (const f of requiredFields) {
    const csvCol = Object.keys(mapping).find(k => mapping[k] === f.key);
    if (!csvCol || !row[csvCol]) {
      errors.push(`Champ requis manquant: ${f.label}`);
    }
  }
  return errors;
}

function transformRow(row, mapping, typeId) {
  const obj = {};
  for (const [csvCol, fieldKey] of Object.entries(mapping)) {
    if (!fieldKey || fieldKey === "__ignore__") continue;
    let val = row[csvCol];
    if (val === undefined || val === "") continue;

    // Type coercions
    if (["price", "surface", "rooms", "bedrooms", "budget_min", "budget_max", "surface_min",
         "nb_pieces_min", "apport", "prix_affiche", "prix_offre", "prix_vente_final", "montant"].includes(fieldKey)) {
      val = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    }
    if (["financement_valide"].includes(fieldKey)) {
      val = ["oui", "true", "1", "yes"].includes(val.toLowerCase());
    }
    if (fieldKey === "cities" || fieldKey === "localisations") {
      val = val.split(";").map(v => v.trim()).filter(Boolean);
    }
    obj[fieldKey] = val;
  }
  return obj;
}

export default function ImportWizard({ type, onDone }) {
  const [step, setStep] = useState("upload"); // upload | mapping | preview | done
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({});
  const [validationResults, setValidationResults] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const result = parseCSV(text);
      setParsed(result);
      // Auto-map: try to match CSV headers to field keys/labels
      const autoMap = {};
      result.headers.forEach(h => {
        const hl = h.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const match = type.fields.find(f =>
          f.key === hl || f.key === h.toLowerCase() ||
          f.label.toLowerCase().replace(/[^a-z0-9]/g, "_").startsWith(hl.slice(0, 5))
        );
        autoMap[h] = match ? match.key : "__ignore__";
      });
      setMapping(autoMap);
      setStep("mapping");
    };
    reader.readAsText(f, "UTF-8");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const runValidation = () => {
    const results = parsed.rows.map((row, i) => ({
      index: i + 1,
      row,
      transformed: transformRow(row, mapping, type.id),
      errors: validateRow(row, mapping, type.fields),
    }));
    setValidationResults(results);
    setStep("preview");
  };

  const handleImport = async () => {
    setImporting(true);
    const valid = validationResults.filter(r => r.errors.length === 0);
    const entity = base44.entities[type.id];
    let success = 0, failed = 0;
    // Batch import
    const batchSize = 20;
    for (let i = 0; i < valid.length; i += batchSize) {
      const batch = valid.slice(i, i + batchSize).map(r => r.transformed);
      try {
        await entity.bulkCreate(batch);
        success += batch.length;
      } catch {
        failed += batch.length;
      }
    }
    setImportResult({ success, failed, total: validationResults.length });
    setImporting(false);
    setStep("done");
  };

  const downloadTemplate = () => {
    const headers = type.fields.map(f => f.key).join(",");
    const example = type.example.join(",");
    const blob = new Blob([headers + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `template_${type.id.toLowerCase()}.csv`; a.click();
  };

  const errorCount = validationResults.filter(r => r.errors.length > 0).length;
  const validCount = validationResults.filter(r => r.errors.length === 0).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">{type.icon}</div>
          <div>
            <h2 className="font-semibold">Import — {type.label}</h2>
            <p className="text-sm text-muted-foreground">{type.fields.length} champs disponibles · {type.fields.filter(f => f.required).length} requis</p>
          </div>
          <div className="ml-auto">
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Download className="w-3.5 h-3.5" /> Télécharger le template
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {["upload", "mapping", "preview", "done"].map((s, i) => {
            const stepLabels = ["Fichier", "Mapping", "Vérification", "Terminé"];
            const stepIdx = ["upload", "mapping", "preview", "done"].indexOf(step);
            const isDone = i < stepIdx;
            const isCurrent = s === step;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${isCurrent ? "text-primary" : isDone ? "text-green-600" : "text-muted-foreground"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDone ? "bg-green-100 text-green-600" : isCurrent ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  }`}>{isDone ? "✓" : i + 1}</span>
                  {stepLabels[i]}
                </div>
                {i < 3 && <div className={`h-px w-8 ${i < stepIdx ? "bg-green-300" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP: Upload */}
      {step === "upload" && (
        <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-4">
          <div
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
            <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium">Glissez votre fichier CSV ici</p>
            <p className="text-xs text-muted-foreground mt-1">ou cliquez pour parcourir</p>
            <p className="text-xs text-muted-foreground/60 mt-3">CSV, séparateur virgule ou point-virgule · Encodage UTF-8</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* STEP: Mapping */}
      {step === "mapping" && parsed && (
        <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Correspondance des colonnes</p>
              <p className="text-sm text-muted-foreground">{parsed.headers.length} colonne{parsed.headers.length > 1 ? "s" : ""} détectée{parsed.headers.length > 1 ? "s" : ""} · {parsed.rows.length} lignes</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-full px-3 py-1.5">
              <FileText className="w-3.5 h-3.5" /> {file?.name}
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
              <span>Colonne CSV</span><span>Champ ImmoPilot</span>
            </div>
            {parsed.headers.map(h => (
              <div key={h} className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2 text-sm font-medium min-w-0">
                  <span className="truncate">{h}</span>
                  {parsed.rows[0]?.[h] && (
                    <span className="text-xs text-muted-foreground truncate">→ {parsed.rows[0][h]}</span>
                  )}
                </div>
                <Select value={mapping[h] || "__ignore__"} onValueChange={v => setMapping(prev => ({ ...prev, [h]: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ignore__"><span className="text-muted-foreground italic">Ignorer</span></SelectItem>
                    {type.fields.map(f => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}{f.required ? " *" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              * = champ requis · {Object.values(mapping).filter(v => v !== "__ignore__").length} champ{Object.values(mapping).filter(v => v !== "__ignore__").length > 1 ? "s" : ""} mappé{Object.values(mapping).filter(v => v !== "__ignore__").length > 1 ? "s" : ""}
            </p>
            <Button className="rounded-full h-9 text-sm" onClick={runValidation}>
              Vérifier les données →
            </Button>
          </div>
        </div>
      )}

      {/* STEP: Preview / Validation */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-border/50 p-4 text-center">
              <p className="text-2xl font-bold">{validationResults.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Lignes totales</p>
            </div>
            <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{validCount}</p>
              <p className="text-xs text-green-600 mt-0.5">Valides</p>
            </div>
            <div className={`rounded-2xl border p-4 text-center ${errorCount > 0 ? "bg-red-50 border-red-200" : "bg-secondary border-border/50"}`}>
              <p className={`text-2xl font-bold ${errorCount > 0 ? "text-red-600" : "text-muted-foreground"}`}>{errorCount}</p>
              <p className={`text-xs mt-0.5 ${errorCount > 0 ? "text-red-500" : "text-muted-foreground"}`}>Avec erreurs</p>
            </div>
          </div>

          {/* Error rows */}
          {errorCount > 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" /> Lignes avec erreurs (ignorées à l'import)
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {validationResults.filter(r => r.errors.length > 0).slice(0, 20).map(r => (
                  <div key={r.index} className="flex items-start gap-3 bg-red-50 rounded-xl px-4 py-2.5">
                    <span className="text-xs text-red-500 font-mono flex-shrink-0">L.{r.index}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{Object.values(r.row).filter(Boolean).join(" · ").slice(0, 80)}</p>
                      {r.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-600 mt-0.5">⚠ {e}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid preview */}
          {validCount > 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Aperçu des données valides
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      {Object.keys(validationResults.find(r => r.errors.length === 0)?.transformed || {}).slice(0, 6).map(k => (
                        <th key={k} className="text-left py-2 pr-4 text-muted-foreground font-medium">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {validationResults.filter(r => r.errors.length === 0).slice(0, 5).map(r => (
                      <tr key={r.index} className="hover:bg-secondary/10">
                        {Object.values(r.transformed).slice(0, 6).map((v, i) => (
                          <td key={i} className="py-2 pr-4 truncate max-w-[120px]">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validCount > 5 && <p className="text-xs text-muted-foreground mt-2">… et {validCount - 5} autres lignes</p>}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="rounded-full h-9 text-sm" onClick={() => setStep("mapping")}>← Modifier le mapping</Button>
            <Button className="rounded-full h-9 text-sm flex-1" onClick={handleImport} disabled={importing || validCount === 0}>
              {importing ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Import en cours…</> : `Importer ${validCount} enregistrement${validCount > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}

      {/* STEP: Done */}
      {step === "done" && importResult && (
        <div className="bg-white rounded-2xl border border-border/50 p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold">Import terminé !</p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-green-600 font-semibold">{importResult.success} enregistrement{importResult.success > 1 ? "s" : ""}</span> importé{importResult.success > 1 ? "s" : ""} avec succès
              {importResult.failed > 0 && <span className="text-red-500"> · {importResult.failed} échoué{importResult.failed > 1 ? "s" : ""}</span>}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="rounded-full h-9 text-sm" onClick={onDone}>Nouvel import</Button>
          </div>
        </div>
      )}
    </div>
  );
}