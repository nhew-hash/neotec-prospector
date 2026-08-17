import { HTMLAttributes } from "react";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-muted",
  success: "bg-success-100 text-success-500",
  warning: "bg-warning-100 text-warning-500",
  danger: "bg-danger-100 text-danger-500",
  brand: "bg-brand-500/10 text-brand-500",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
