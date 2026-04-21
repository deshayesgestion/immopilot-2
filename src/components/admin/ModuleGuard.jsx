import { useOrganization } from '@/lib/OrganizationContext';
import { canAccessModule } from '@/lib/organizationAccess';
import { Lock } from 'lucide-react';

/**
 * Affiche le contenu si le module est actif, sinon un message d'indisponibilité.
 * @param {"vente"|"location"|"compta"} moduleName
 */
// 🛠️ DEBUG MODE — bypass module restrictions (restore when SaaS config is stable)
const DEBUG_BYPASS_MODULES = true;

export default function ModuleGuard({ moduleName, children }) {
  const { organizationConfig, loading } = useOrganization();

  if (DEBUG_BYPASS_MODULES) return children;

  if (loading) return null;

  if (!canAccessModule(organizationConfig, moduleName)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
        <div className="bg-secondary/60 rounded-full p-4 mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Module non disponible</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Ce module n'est pas disponible dans votre abonnement actuel.
        </p>
      </div>
    );
  }

  return children;
}