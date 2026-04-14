import { DS } from "@/lib/designSystem";

/**
 * Card — Wrapper pour cartes standardisées responsive
 * Variantes: default | elevated | interactive | subtle
 */
export default function Card({ children, variant = "default", className = "" }) {
  return (
    <div className={`${DS.card(variant)} ${className}`}>
      <div className={DS.cardPadding()}>
        {children}
      </div>
    </div>
  );
}

/**
 * CardHeader — En-tête de carte avec titre et actions
 */
export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 sm:pb-5 border-b border-border/50 ${className}`}>
      <div className="flex-1">
        <h3 className={DS.h4()}>{title}</h3>
        {subtitle && (
          <p className={`${DS.bodyMuted()} mt-1`}>{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * CardContent — Contenu principal de la carte
 */
export function CardContent({ children, className = "" }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

/**
 * CardFooter — Pied de carte avec actions
 */
export function CardFooter({ children, className = "" }) {
  return (
    <div className={`pt-4 sm:pt-5 border-t border-border/50 flex flex-col sm:flex-row gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardGrid — Grille responsive de cartes
 */
export function CardGrid({ children, cols = { sm: 1, md: 2, lg: 3 }, className = "" }) {
  const { sm = 1, md = 2, lg = 3 } = cols;
  return (
    <div className={`grid gap-4 sm:gap-5 md:gap-6 grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} ${className}`}>
      {children}
    </div>
  );
}