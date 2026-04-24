import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, X, Loader2, FileText, AlertTriangle, PenTool, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Page publique de signature — accessible via /signature?token=xxx&rid=yyy
export default function Signature() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const rid = params.get("rid");

  const [state, setState] = useState("loading"); // loading | ready | signing | signed | already | expired | error
  const [info, setInfo] = useState(null);
  const [agency, setAgency] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!token || !rid) { setState("error"); return; }
    verify();
  }, []);

  const verify = async () => {
    const res = await base44.functions.invoke("signatureManager", { action: "verify_token", token, request_id: rid });
    const data = res.data;
    if (data.expired) { setState("expired"); return; }
    if (data.already_signed) { setState("already"); return; }
    if (!data.valid) { setState("error"); return; }
    setInfo(data);
    base44.entities.Agency.list().then(l => l[0] && setAgency(l[0]));
    setState("ready");
  };

  // ── Canvas signature ─────────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    isDrawing.current = true;
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = (e) => {
    e.preventDefault();
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const signer = async () => {
    if (!agreed || !hasDrawn) return;
    setSigning(true);
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL("image/png");
    const res = await base44.functions.invoke("signatureManager", {
      action: "sign", token, request_id: rid, signature_data: signatureData,
    });
    const data = res.data;
    if (data.success) {
      setState(data.tous_signes ? "signed_complete" : "signed");
    } else if (data.error === "already_signed") {
      setState("already");
    } else {
      setState("error");
    }
    setSigning(false);
  };

  const brandColor = agency?.primary_color || "#4F46E5";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header agence */}
      <div style={{ background: brandColor }} className="px-6 py-4 flex items-center gap-3 shadow-sm">
        {agency?.logo_url && <img src={agency.logo_url} alt="logo" className="h-8 rounded" />}
        <div>
          <p className="text-white font-bold text-base">{agency?.name || "Agence Immobilière"}</p>
          <p className="text-white/75 text-xs">Signature électronique sécurisée</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
          <span className="text-white text-[11px] font-medium">Conforme eIDAS</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-lg space-y-4">

          {/* Loading */}
          {state === "loading" && (
            <div className="bg-white rounded-2xl shadow p-10 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Vérification du lien de signature…</p>
            </div>
          )}

          {/* Expiré */}
          {state === "expired" && (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-base font-bold">Lien expiré</p>
              <p className="text-sm text-muted-foreground mt-1">Ce lien de signature n'est plus valide. Contactez l'agence pour en recevoir un nouveau.</p>
            </div>
          )}

          {/* Déjà signé */}
          {state === "already" && (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-base font-bold text-green-800">Déjà signé</p>
              <p className="text-sm text-muted-foreground mt-1">Vous avez déjà signé ce document. Aucune action supplémentaire n'est requise.</p>
            </div>
          )}

          {/* Erreur */}
          {state === "error" && (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <X className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-base font-bold">Lien invalide</p>
              <p className="text-sm text-muted-foreground mt-1">Ce lien de signature est invalide ou introuvable.</p>
            </div>
          )}

          {/* Signé avec succès */}
          {(state === "signed" || state === "signed_complete") && (
            <div className="bg-white rounded-2xl shadow p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-800">Signature enregistrée ✓</p>
              <p className="text-sm text-muted-foreground">
                {state === "signed_complete"
                  ? "Tous les signataires ont signé. Le document est maintenant légalement exécutoire."
                  : "Votre signature a été enregistrée. En attente des autres signataires."}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-left">
                <p className="text-xs font-semibold text-green-800 mb-1">Preuve de signature</p>
                <p className="text-[11px] text-green-700">Horodatée le {new Date().toLocaleString("fr-FR")}</p>
                <p className="text-[11px] text-green-700">Conforme au règlement eIDAS (UE) 910/2014</p>
              </div>
            </div>
          )}

          {/* Formulaire de signature */}
          {state === "ready" && info && (
            <>
              {/* Info document */}
              <div className="bg-white rounded-2xl shadow p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{info.document?.titre}</p>
                    <p className="text-xs text-muted-foreground capitalize">{info.document?.type?.replace(/_/g," ")}</p>
                  </div>
                </div>
                <div className="bg-secondary/20 rounded-xl px-4 py-3 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Signataire</span><p className="font-semibold mt-0.5">{info.signataire?.nom}</p></div>
                  <div><span className="text-muted-foreground">Rôle</span><p className="font-semibold mt-0.5 capitalize">{info.signataire?.role}</p></div>
                </div>
                {info.document?.url && (
                  <a href={info.document.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <FileText className="w-3 h-3" /> Consulter le document PDF
                  </a>
                )}
              </div>

              {/* Zone de signature manuscrite */}
              <div className="bg-white rounded-2xl shadow p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-primary" /> Votre signature
                  </p>
                  <button onClick={clearCanvas} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <RotateCcw className="w-3 h-3" /> Effacer
                  </button>
                </div>
                <div className="border-2 border-dashed border-border rounded-xl bg-slate-50 overflow-hidden" style={{ touchAction: "none" }}>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full h-48 cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
                {!hasDrawn && (
                  <p className="text-[11px] text-muted-foreground text-center">Signez dans la zone ci-dessus en maintenant le clic ou avec votre doigt</p>
                )}
              </div>

              {/* Consentement + Bouton */}
              <div className="bg-white rounded-2xl shadow p-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-primary flex-shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Je reconnais avoir lu le document et j'accepte de le signer électroniquement. Ma signature a valeur juridique conformément au <strong>règlement eIDAS (UE) n°910/2014</strong>. Je certifie être {info.signataire?.nom}.
                  </span>
                </label>

                <Button
                  className="w-full rounded-xl h-12 text-sm font-bold gap-2"
                  style={{ background: agreed && hasDrawn ? brandColor : undefined }}
                  onClick={signer}
                  disabled={!agreed || !hasDrawn || signing}
                >
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {signing ? "Enregistrement de la signature…" : "Signer le document"}
                </Button>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center">
                  <span>🔒</span>
                  <span>Signature sécurisée · Horodatée · Conforme eIDAS · Archivée</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}