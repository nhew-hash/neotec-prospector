import { Card, CardContent } from "@/components/ui/Card";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "danger";
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold",
            tone === "accent" && "text-brand-500",
            tone === "danger" && "text-danger-500",
            tone === "default" && "text-foreground"
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </CardContent>
    </Card>
  );
}
