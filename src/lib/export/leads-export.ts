import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { LeadWithCompany } from "@/types";
import { STATUS_LABELS } from "@/lib/config/default-settings";
import { TEMPERATURE_LABELS } from "@/lib/scoring/score-engine";

function toRow(lead: LeadWithCompany) {
  return {
    Empresa: lead.company.name,
    Segmento: lead.segment,
    Cidade: lead.company.city,
    Estado: lead.company.state,
    Telefone: lead.company.phone ?? "Não encontrado",
    WhatsApp: lead.company.whatsapp ?? "Não encontrado",
    Site: lead.company.website ?? "Não encontrado",
    Instagram: lead.company.instagram ?? "Não encontrado",
    Google: lead.company.google_profile_url ?? "Não encontrado",
    Avaliação: lead.company.rating ?? "Não encontrado",
    "Quantidade de avaliações": lead.company.reviews_count ?? "Não encontrado",
    Score: lead.score,
    Temperatura: TEMPERATURE_LABELS[lead.temperature],
    Status: STATUS_LABELS[lead.status] ?? lead.status,
    Observações: lead.reasons.join(" | "),
  };
}

export function leadsToCSV(leads: LeadWithCompany[]): string {
  const rows = leads.map(toRow);
  return Papa.unparse(rows, { delimiter: ";" });
}

export function leadsToXLSXBuffer(leads: LeadWithCompany[]): Buffer {
  const rows = leads.map(toRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  const arrayBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return arrayBuffer as Buffer;
}
