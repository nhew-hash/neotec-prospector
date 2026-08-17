import { listCompanies } from "@/lib/repository/companies";
import { Card } from "@/components/ui/Card";
import { formatDateBR } from "@/lib/utils/format";

export default async function EmpresasPage() {
  const companies = await listCompanies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Empresas</h1>
        <p className="text-sm text-muted mt-1">
          Base única de empresas coletadas — duplicadas de novas prospecções atualizam o mesmo registro.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-100/60 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Fonte</th>
                <th className="px-4 py-3">Coletado em</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-slate-100/50">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.category}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{c.city}/{c.state}</td>
                  <td className="px-4 py-3 text-muted">{c.phone ?? "Não encontrado"}</td>
                  <td className="px-4 py-3 text-muted">{c.website ?? "Não encontrado"}</td>
                  <td className="px-4 py-3 text-muted">{c.source}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDateBR(c.collected_at)}</td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                    Nenhuma empresa coletada ainda. Crie uma prospecção para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
