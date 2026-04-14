import { DS } from "@/lib/designSystem";

/**
 * Section — Organise les blocs verticalement avec espacement
 * Utilisation: <Section title="Titre">Contenu</Section>
 */
export default function Section({ title, subtitle, children, className = "", spacing = "space-y-6" }) {
  return (
    <div className={`${spacing} ${className}`}>
      {title && (
        <div className="mb-2 sm:mb-4">
          <h2 className={DS.h3()}>{title}</h2>
          {subtitle && (
            <p className={`${DS.bodyMuted()} mt-1`}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * SectionDivider — Ligne de séparation entre sections
 */
export function SectionDivider() {
  return <div className={`${DS.divider()} my-6 sm:my-8`} />;
}