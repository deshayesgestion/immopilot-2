import { DS } from "@/lib/designSystem";
import Container from "./Container";

/**
 * PageLayout — Wrapper global pour toutes les pages
 * Gère: bg + structure + responsiveness mobile/desktop
 * 
 * Utilisation:
 * <PageLayout>
 *   <PageHeader title="Titre" description="..." />
 *   <PageContent>Contenu</PageContent>
 * </PageLayout>
 */
export default function PageLayout({ children, variant = "default" }) {
  const variants = {
    default: "bg-background",
    secondary: "bg-secondary/10",
    muted: "bg-muted/20",
  };

  return (
    <div className={`${DS.pageWrapper()} ${variants[variant]}`}>
      <Container className={DS.contentArea()}>
        {children}
      </Container>
    </div>
  );
}

/**
 * PageHeader — Titre + description en haut de page
 */
export function PageHeader({ title, description, action = null, className = "" }) {
  return (
    <div className={`mb-6 sm:mb-8 md:mb-10 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
        <div className="flex-1">
          <h1 className={DS.h1()}>{title}</h1>
          {description && (
            <p className={`${DS.bodyMuted()} max-w-2xl mt-1 sm:mt-2`}>
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PageContent — Wrapper pour le contenu principal
 */
export function PageContent({ children, className = "" }) {
  return (
    <div className={`${DS.section()} ${className}`}>
      {children}
    </div>
  );
}