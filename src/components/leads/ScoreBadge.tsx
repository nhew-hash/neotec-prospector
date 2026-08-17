function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color =
    score >= 80 ? "text-danger-500 border-danger-500/30 bg-danger-100/60" :
    score >= 60 ? "text-warning-500 border-warning-500/30 bg-warning-100/60" :
    "text-muted border-border bg-slate-100";

  const sizeClasses =
    size === "lg" ? "h-16 w-16 text-lg" : size === "sm" ? "h-8 w-8 text-[11px]" : "h-11 w-11 text-sm";

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-full border font-semibold shrink-0",
        color,
        sizeClasses
      )}
      title={`Score de oportunidade: ${score}/100`}
    >
      {score}
    </div>
  );
}
