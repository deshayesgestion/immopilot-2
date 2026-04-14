import { DS } from "@/lib/designSystem";
import { forwardRef } from "react";

/**
 * Input — Champ texte standardisé responsive
 */
const Input = forwardRef(({ className = "", size = "md", error = false, ...props }, ref) => {
  const sizeClass = size === "sm" ? "text-xs sm:text-sm" : "text-sm sm:text-base";
  const errorClass = error ? "border-destructive" : "";
  
  return (
    <input
      ref={ref}
      className={`${DS.input()} ${sizeClass} ${errorClass} ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;