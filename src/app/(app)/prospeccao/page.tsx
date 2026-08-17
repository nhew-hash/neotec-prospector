import { getSettings } from "@/lib/settings";
import { ProspectingForm } from "./ProspectingForm";

export default async function ProspeccaoPage() {
  const settings = await getSettings();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Nova prospecção</h1>
        <p className="text-sm text-muted mt-1">
          Escolha a região e os segmentos. O sistema busca empresas reais, analisa a presença
          digital de cada uma e entrega apenas os melhores leads.
        </p>
      </div>
      <ProspectingForm settings={settings} />
    </div>
  );
}
