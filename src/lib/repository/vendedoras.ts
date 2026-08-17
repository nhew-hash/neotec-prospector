import { listAllLeads, listAllContacts } from "./leads";
import { listSales, listCommissions } from "./sales";
import type { PublicUser } from "@/types";

export interface VendedoraStats {
  leads_recebidos: number;
  ligacoes: number;
  contatos: number;
  interessados: number;
  propostas: number;
  vendas: number;
  conversao_pct: number;
  comissao: number;
  valor_vendido: number;
}

export async function getVendedoraStats(user: PublicUser): Promise<VendedoraStats> {
  const [leads, contacts, sales, commissions] = await Promise.all([
    listAllLeads(),
    listAllContacts(),
    listSales(),
    listCommissions(),
  ]);

  const myLeads = leads.filter((l) => l.assigned_to === user.id);
  const myContacts = contacts.filter((c) => c.user_id === user.id);
  const mySales = sales.filter((s) => s.user_id === user.id);
  const myCommissions = commissions.filter((c) => c.user_id === user.id);

  const interessados = myLeads.filter((l) =>
    ["interessado", "proposta_enviada", "negociacao", "venda_fechada"].includes(l.status)
  ).length;
  const propostas = myLeads.filter((l) => ["proposta_enviada", "negociacao"].includes(l.status)).length;
  const vendas = myLeads.filter((l) => l.status === "venda_fechada").length;
  const contatosUnicos = new Set(myContacts.map((c) => c.lead_id)).size;

  return {
    leads_recebidos: myLeads.length,
    ligacoes: myContacts.length,
    contatos: contatosUnicos,
    interessados,
    propostas,
    vendas,
    conversao_pct: myLeads.length > 0 ? Math.round((vendas / myLeads.length) * 1000) / 10 : 0,
    comissao: myCommissions.reduce((sum, c) => sum + c.amount, 0),
    valor_vendido: mySales.reduce((sum, s) => sum + s.amount, 0),
  };
}
