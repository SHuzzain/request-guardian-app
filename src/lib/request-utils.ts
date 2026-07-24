export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border border-warning/30",
  approved: "bg-success/15 text-success border border-success/30",
  rejected: "bg-destructive/15 text-destructive border border-destructive/30",
  needs_changes: "bg-info/15 text-info border border-info/30",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needs_changes: "Need Changes",
};

export const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-info/10 text-info border border-info/20",
  medium: "bg-accent text-accent-foreground border border-accent",
  high: "bg-warning/15 text-warning-foreground border border-warning/30",
  urgent: "bg-destructive/15 text-destructive border border-destructive/30",
};

export function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
