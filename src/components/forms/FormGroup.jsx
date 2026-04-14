import { DS } from "@/lib/designSystem";

/**
 * FormGroup — Wrapper pour champs de formulaire
 */
export default function FormGroup({ label, error, required = false, children, className = "" }) {
  return (
    <div className={`${DS.formGroup()} ${className}`}>
      {label && (
        <label className={DS.label()}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className={`${DS.bodyMuted()} text-destructive text-xs sm:text-sm`}>
          {error}
        </p>
      )}
    </div>
  );
}