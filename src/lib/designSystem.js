/**
 * Design System — ImmoPilot
 * Tokens et helpers centralisés pour garantir la cohérence visuelle
 * 
 * Utilisation:
 * import { DS } from "@/lib/designSystem";
 * <div className={DS.card()}> ... </div>
 */

export const DS = {
  // ────────────────────────────────────────────────────────────
  // SPACING
  // ────────────────────────────────────────────────────────────
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },

  // ────────────────────────────────────────────────────────────
  // LAYOUT HELPERS
  // ────────────────────────────────────────────────────────────
  container: (maxWidth = "max-w-6xl") => `${maxWidth} mx-auto px-4 sm:px-6`,
  
  pageWrapper: () => "min-h-screen bg-background",
  
  contentArea: () => "py-6 sm:py-8 md:py-12",

  section: (spacing = "space-y-6") => `${spacing}`,

  // ────────────────────────────────────────────────────────────
  // CARDS & CONTAINERS
  // ────────────────────────────────────────────────────────────
  card: (variant = "default") => {
    const variants = {
      default: "bg-card rounded-lg sm:rounded-xl border border-border/50 shadow-sm",
      elevated: "bg-card rounded-lg sm:rounded-xl border border-border shadow-md hover:shadow-lg transition-shadow",
      interactive: "bg-card rounded-lg sm:rounded-xl border border-border/50 shadow-sm hover:shadow-md active:shadow-sm transition-all cursor-pointer",
      subtle: "bg-secondary/30 rounded-lg sm:rounded-xl border border-border/20",
    };
    return variants[variant] || variants.default;
  },

  cardPadding: () => "p-4 sm:p-5 md:p-6",

  // ────────────────────────────────────────────────────────────
  // TYPOGRAPHY
  // ────────────────────────────────────────────────────────────
  h1: () => "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground",
  h2: () => "text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground",
  h3: () => "text-lg sm:text-xl font-bold text-foreground",
  h4: () => "text-base sm:text-lg font-semibold text-foreground",
  
  body: () => "text-sm sm:text-base text-foreground/90 leading-relaxed",
  bodyMuted: () => "text-xs sm:text-sm text-muted-foreground",
  label: () => "text-xs sm:text-sm font-medium text-foreground",

  // ────────────────────────────────────────────────────────────
  // BUTTONS
  // ────────────────────────────────────────────────────────────
  button: (variant = "primary", size = "md") => {
    const variantClasses = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
      outline: "border border-input bg-transparent text-foreground hover:bg-secondary/50 active:bg-secondary/30",
      ghost: "text-foreground hover:bg-secondary/30 active:bg-secondary/50",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs sm:text-sm rounded",
      md: "px-4 py-2 text-sm sm:text-base rounded-md",
      lg: "px-6 py-3 text-base sm:text-lg rounded-lg w-full sm:w-auto",
    };

    return `${variantClasses[variant]} ${sizeClasses[size]} font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`;
  },

  // ────────────────────────────────────────────────────────────
  // FORMS
  // ────────────────────────────────────────────────────────────
  inputBase: () => "w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors",

  input: () => DS.inputBase(),

  select: () => DS.inputBase() + " cursor-pointer",

  textarea: () => DS.inputBase() + " resize-vertical min-h-[100px]",

  formGroup: () => "space-y-2",

  // ────────────────────────────────────────────────────────────
  // GRIDS & LAYOUTS
  // ────────────────────────────────────────────────────────────
  gridResponsive: (cols = { sm: 1, md: 2, lg: 3 }) => {
    const { sm = 1, md = 2, lg = 3 } = cols;
    return `grid grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} gap-4 sm:gap-5 md:gap-6`;
  },

  flexBetween: () => "flex items-center justify-between gap-4",
  flexCenter: () => "flex items-center justify-center gap-4",
  flexColumn: () => "flex flex-col gap-4",

  // ────────────────────────────────────────────────────────────
  // BADGES & PILLS
  // ────────────────────────────────────────────────────────────
  badge: (variant = "default") => {
    const variants = {
      default: "bg-secondary text-secondary-foreground",
      primary: "bg-primary/10 text-primary",
      success: "bg-green-100 text-green-700",
      warning: "bg-amber-100 text-amber-700",
      destructive: "bg-red-100 text-red-700",
    };
    return `inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${variants[variant]}`;
  },

  // ────────────────────────────────────────────────────────────
  // STATES & FEEDBACK
  // ────────────────────────────────────────────────────────────
  loading: () => "animate-spin text-primary",
  spinner: () => "w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin",

  alertBox: (type = "info") => {
    const types = {
      info: "bg-blue-50 border border-blue-200 text-blue-800",
      success: "bg-green-50 border border-green-200 text-green-800",
      warning: "bg-amber-50 border border-amber-200 text-amber-800",
      error: "bg-red-50 border border-red-200 text-red-800",
    };
    return `rounded-lg p-4 text-sm ${types[type]}`;
  },

  // ────────────────────────────────────────────────────────────
  // UTILITIES
  // ────────────────────────────────────────────────────────────
  divider: () => "border-t border-border/50",
  skeleton: () => "animate-pulse bg-secondary/50 rounded",
  
  truncate: () => "truncate",
  lineClamp: (lines = 1) => `line-clamp-${lines}`,

  shadow: (size = "md") => {
    const shadows = {
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-xl",
    };
    return shadows[size] || shadows.md;
  },

  transition: (duration = "base") => {
    const durations = {
      fast: "transition-all duration-150",
      base: "transition-all duration-300",
      slow: "transition-all duration-500",
    };
    return durations[duration] || durations.base;
  },

  // ────────────────────────────────────────────────────────────
  // RESPONSIVE HELPERS
  // ────────────────────────────────────────────────────────────
  mobileOnly: () => "sm:hidden",
  desktopOnly: () => "hidden sm:block",
  mobileHidden: () => "hidden sm:flex",
  
  responsiveText: (mobile = "text-sm", desktop = "sm:text-base") => `${mobile} ${desktop}`,
  responsivePadding: (mobile = "p-4", desktop = "sm:p-6") => `${mobile} ${desktop}`,
};

/**
 * Helpers for common component patterns
 */
export const ComponentPatterns = {
  // Page header with title + description
  pageHeader: () => ({
    wrapper: "mb-8",
    title: DS.h1() + " mb-2",
    description: DS.bodyMuted() + " max-w-2xl",
  }),

  // Form field wrapper
  formField: () => ({
    wrapper: DS.formGroup(),
    label: DS.label() + " block mb-1",
    error: "text-xs text-destructive mt-1",
  }),

  // Card with header + content
  cardWithHeader: () => ({
    wrapper: DS.card(),
    header: "px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 flex items-center justify-between",
    headerTitle: DS.h4(),
    content: "p-4 sm:p-6",
  }),

  // List item (contact, transaction, etc.)
  listItem: () => ({
    wrapper: "flex items-center gap-4 p-4 sm:p-5 border-b border-border/50 hover:bg-secondary/20 transition-colors",
    icon: "w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0",
    content: "flex-1 min-w-0",
    title: DS.h4(),
    subtitle: DS.bodyMuted(),
    action: "flex-shrink-0",
  }),

  // Action bar (top of page with filters/buttons)
  actionBar: () => ({
    wrapper: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6",
    left: "flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto",
    right: "flex gap-2 w-full sm:w-auto",
  }),
};