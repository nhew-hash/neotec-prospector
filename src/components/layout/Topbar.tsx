import type { SessionPayload } from "@/lib/auth/session";
import { LogoutButton } from "./LogoutButton";
import { isUsingDemoData } from "@/lib/data-providers";
import { Badge } from "@/components/ui/Badge";

export function Topbar({ session, title }: { session: SessionPayload; title?: string }) {
  const demo = isUsingDemoData();
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 md:px-8 py-4 sticky top-0 z-10">
      <div>
        {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
        {demo && (
          <Badge tone="warning" className="mt-1">
            Dados de demonstração — conecte uma fonte real em Configurações
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground leading-tight">{session.name}</p>
          <p className="text-xs text-muted leading-tight">
            {session.role === "admin" ? "Administrador" : "Vendedora"}
          </p>
        </div>
        <div className="h-9 w-9 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center text-sm font-semibold">
          {session.name.slice(0, 1).toUpperCase()}
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
