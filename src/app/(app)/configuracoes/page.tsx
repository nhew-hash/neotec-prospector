import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export default async function ConfiguracoesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const settings = await getSettings();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted mt-1">
          Ajuste o algoritmo de score, segmentos, comissão e demais parâmetros do sistema.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
