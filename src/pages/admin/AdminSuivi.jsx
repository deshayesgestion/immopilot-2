import { Eye } from "lucide-react";

export default function AdminSuivi() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suivi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Suivi en temps réel des biens et locataires</p>
      </div>
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-24">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
          <Eye className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Bientôt disponible</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Le suivi des locations sera disponible prochainement.</p>
      </div>
    </div>
  );
}