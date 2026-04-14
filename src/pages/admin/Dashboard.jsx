import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import DashboardAdmin from "../../components/dashboard/DashboardAdmin";
import DashboardAgent from "../../components/dashboard/DashboardAgent";
import DashboardGestionnaire from "../../components/dashboard/DashboardGestionnaire";
import DashboardComptable from "../../components/dashboard/DashboardComptable";
import OnboardingChecklist from "../../components/onboarding/OnboardingChecklist";
import { ROLE_STEP_LABELS } from "@/lib/onboardingSteps";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingProgress, setOnboardingProgress] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.Agency.list("-created_date", 1),
    ]).then(([me, agencies]) => {
      setUser(me);
      setAgency(agencies[0] || null);
      // Load onboarding progress
      if (me?.email) {
        base44.entities.OnboardingProgress.filter({ user_email: me.email }).then(results => {
          setOnboardingProgress(results[0] || null);
        }).catch(() => {});
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const role = user?.role || "admin";
  const roleLabel = ROLE_STEP_LABELS[role] || "Utilisateur";

  const renderDashboard = () => {
    switch (role) {
      case "agent": return <DashboardAgent user={user} />;
      case "gestionnaire": return <DashboardGestionnaire user={user} />;
      case "comptable": return <DashboardComptable user={user} />;
      default: return <DashboardAdmin agency={agency} />;
    }
  };

  const showChecklist = !onboardingProgress?.dismissed && !onboardingProgress?.completed;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {roleLabel} · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Onboarding checklist (shown until dismissed) */}
      {showChecklist && (
        <OnboardingChecklist
          user={user}
          progress={onboardingProgress}
          onProgressChange={setOnboardingProgress}
        />
      )}

      {/* Role-based dashboard */}
      {renderDashboard()}
    </div>
  );
}