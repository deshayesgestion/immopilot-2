import { DS } from "@/lib/designSystem";
import { Loader2 } from "lucide-react";

/**
 * Button — Bouton standardisé avec responsive sizing
 * Variantes: primary | secondary | outline | ghost | destructive
 * Sizes: sm | md | lg
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
  iconPosition = "left",
  className = "",
  ...props
}) {
  const baseClass = DS.button(variant, size);
  const widthClass = fullWidth ? "w-full" : "w-auto";
  
  return (
    <button
      className={`${baseClass} ${widthClass} ${className} inline-flex items-center justify-center gap-2`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {Icon && iconPosition === "left" && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === "right" && <Icon className="w-4 h-4" />}
    </button>
  );
}

/**
 * ButtonGroup — Groupe de boutons responsive
 */
export function ButtonGroup({ children, orientation = "horizontal", className = "" }) {
  const directionClass = orientation === "vertical" ? "flex-col" : "flex-row";
  return (
    <div className={`flex ${directionClass} gap-2 sm:gap-3 ${className}`}>
      {children}
    </div>
  );
}