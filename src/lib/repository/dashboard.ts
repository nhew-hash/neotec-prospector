import { listLeadsWithCompany, listAllFollowups, listAllContacts } from "./leads";
import { listSales } from "./sales";
import type { DashboardStats, LeadWithCompany } from "@/types";
import { todayISODate } from "@/lib/utils/format";

export async function getDashboardStats(assignedTo?: string): Promise<DashboardStats> {
  const leads = await listLeadsWithCompany(assignedTo ? { assignedTo } : {});
  const sales = await listSales();
  const followups = await listAllFollowups();
  const contacts = await listAllContacts();

  const relevantSales = assignedTo ? sales.filter((s) => s.user_id === assignedTo) : sales;

  const leadsQuentes = leads.filter((l) => l.temperature === "quente").length;
  const propostas = leads.filter((l) => l.status === "proposta_enviada" || l.status === "negociacao").length;
  const vendas = leads.filter((l) => l.status === "venda_fechada").length;
  const valorVendido = relevantSales.reduce((sum, s) => sum + s.amount, 0);

  const today = todayISODate();
  const leadById = new Map(leads.map((l) => [l.id, l]));
  const followupsHoje = followups
    .filter((f) => f.next_contact_date === today && !f.done)
    .filter((f) => !assignedTo || f.user_id === assignedTo)
    .map((f) => ({ ...f, lead: leadById.get(f.lead_id) as LeadWithCompany }))
    .filter((f) => Boolean(f.lead));

  const contatados = new Set(
    contacts.filter((c) => !assignedTo || c.user_id === assignedTo).map((c) => c.lead_id)
  ).size;
  const interessados = leads.filter((l) =>
    ["interessado", "proposta_enviada", "negociacao", "venda_fechada"].includes(l.status)
  ).length;

  const leadsParaLigarHoje = leads.filter(
    (l) => l.status === "novo" || l.status === "retornar_depois"
  ).length;

  return {
    leads_encontrados: leads.length,
    leads_quentes: leadsQuentes,
    leads_para_ligar_hoje: leadsParaLigarHoje,
    propostas,
    vendas,
    valor_vendido: valorVendido,
    funil: {
      encontrados: leads.length,
      contatados,
      interessados,
      propostas,
      vendas,
    },
    followups_hoje: followupsHoje,
  };
}

export async function getBestOpportunities(limit = 20, assignedTo?: string): Promise<LeadWithCompany[]> {
  const leads = await listLeadsWithCompany(assignedTo ? { assignedTo } : {});
  const untouched = leads.filter((l) => l.status === "novo" || l.status === "retornar_depois");
  const pool = untouched.length > 0 ? untouched : leads;

  return [...pool]
    .sort((a, b) => {
      // 1) sem site primeiro 2) score desc (já incorpora google/instagram/whatsapp/estabelecida)
      const aNoSite = a.site_analysis.possui_site ? 0 : 1;
      const bNoSite = b.site_analysis.possui_site ? 0 : 1;
      if (aNoSite !== bNoSite) return bNoSite - aNoSite;
      return b.score - a.score;
    })
    .slice(0, limit);
}
