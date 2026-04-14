import { DS } from "@/lib/designSystem";
import { forwardRef } from "react";

/**
 * Select — Dropdown standardisé responsive
 */
const Select = forwardRef(({ children, className = "", error = false, ...props }, ref) => {
  const errorClass = error ? "border-destructive" : "";
  
  return (
    <select
      ref={ref}
      className={`${DS.select()} ${errorClass} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = "Select";

export default Select;