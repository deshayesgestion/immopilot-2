import { DS } from "@/lib/designSystem";

/**
 * Container — Gère la largeur max et padding responsive
 * Utilisation: <Container>...contenu...</Container>
 */
export default function Container({ children, maxWidth = "max-w-6xl", className = "" }) {
  return (
    <div className={`${DS.container(maxWidth)} ${className}`}>
      {children}
    </div>
  );
}