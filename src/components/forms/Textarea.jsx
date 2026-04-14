import { DS } from "@/lib/designSystem";
import { forwardRef } from "react";

/**
 * Textarea — Zone de texte standardisée responsive
 */
const Textarea = forwardRef(({ className = "", error = false, rows = 4, ...props }, ref) => {
  const errorClass = error ? "border-destructive" : "";
  
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${DS.textarea()} ${errorClass} ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export default Textarea;