import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listLeadsWithCompany } from "@/lib/repository/leads";
import { leadsToCSV, leadsToXLSXBuffer } from "@/lib/export/leads-export";
import type { LeadStatus, LeadTemperature } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const leads = await listLeadsWithCompany({
    city: searchParams.get("city") || undefined,
    segment: searchParams.get("segment") || undefined,
    minScore: searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined,
    temperature: (searchParams.get("temperature") as LeadTemperature) || undefined,
    hasWebsite: searchParams.has("hasWebsite") ? searchParams.get("hasWebsite") === "sim" : undefined,
    hasWhatsapp: searchParams.has("hasWhatsapp") ? searchParams.get("hasWhatsapp") === "sim" : undefined,
    status: (searchParams.get("status") as LeadStatus) || undefined,
    assignedTo: searchParams.get("assignedTo") || undefined,
  });

  if (format === "xlsx") {
    const buffer = leadsToXLSXBuffer(leads);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="neotec-leads.xlsx"`,
      },
    });
  }

  const csv = leadsToCSV(leads);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="neotec-leads.csv"`,
    },
  });
}
