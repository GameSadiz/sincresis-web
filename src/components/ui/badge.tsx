import type { ReactNode } from "react";

export type BadgeTone =
  | "primary"
  | "danger"
  | "info"
  | "success"
  | "warning"
  | "neutral";

const tones: Record<BadgeTone, string> = {
  primary: "bg-primary-soft text-primary",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-foreground/[0.06] text-muted",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
