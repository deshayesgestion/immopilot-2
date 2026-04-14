import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Home } from "lucide-react";

export default function EspaceRouter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const redirect = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin("/espace");
        return;
      }
      const user = await base44.auth.me();
      const role = user?.role;
      if (role === "locataire") navigate("/espace/locataire", { replace: true });
      else if (role === "proprietaire") navigate("/espace/proprietaire", { replace: true });
      else if (role === "acquereur") navigate("/espace/acquereur", { replace: true });
      else {
        setError(`Votre rôle (${role || "inconnu"}) ne donne pas accès à un espace client. Contactez votre agence.`);
        setLoading(false);
      }
    };
    redirect();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="bg-white rounded-2xl border border-border/50 p-8 max-w-sm text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <Home className="w-5 h-5 text-orange-500" />
          </div>
          <p className="font-semibold">Accès non autorisé</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <a href="/" className="mt-4 inline-block text-sm text-primary hover:underline">Retour au site</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Chargement de votre espace…</p>
      </div>
    </div>
  );
}