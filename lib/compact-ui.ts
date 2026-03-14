export const compactUi = {
  typography: {
    eyebrow:
      "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground",
    pageTitle: "text-lg font-semibold tracking-tight text-foreground sm:text-xl",
    sectionTitle: "text-sm font-semibold text-foreground",
    cardTitle: "text-sm font-semibold text-foreground",
    body: "text-sm leading-6 text-foreground",
    muted: "text-xs text-muted-foreground",
    helper: "text-xs leading-5 text-muted-foreground",
  },
  spacing: {
    page: "gap-3 p-2",
    section: "gap-3",
    card: "p-3",
    denseCard: "p-2",
    statCard: "p-2",
  },
  controls: {
    input: "h-8 text-sm",
    denseButton: "h-8 text-xs",
    button: "h-9 text-sm",
    label: "text-xs font-medium text-muted-foreground",
  },
} as const;
