import { getStore, TABLES } from "@/lib/db";
import { getDataProvider } from "@/lib/data-providers";
import type { ProspectingParams } from "@/lib/data-providers/types";
import { analyzeSite } from "@/lib/analysis/site-analyzer";
import { computeScore } from "@/lib/scoring/score-engine";
import { buildReasons } from "@/lib/scoring/reasons";
import { generateApproach } from "@/lib/approach/generate-approach";
import { buildDedupeKey, findDuplicate } from "@/lib/dedupe/dedupe";
import { getSettings } from "@/lib/settings";
import type { Company, Lead, LeadScore, LeadSource, ProspectingSearch } from "@/types";

export interface RunProspectingResult {
  search: ProspectingSearch;
  leadsCreated: number;
  leadsUpdated: number;
  totalLeads: number;
  usingDemoData: boolean;
  providerName: string;
}

export async function runProspecting(
  params: ProspectingParams,
  createdBy: string
): Promise<RunProspectingResult> {
  const store = getStore();
  const provider = getDataProvider();
  const settings = await getSettings();

  const search = await store.insert<ProspectingSearch>(TABLES.prospectingSearches, {
    city: params.city,
    state: params.state,
    radius_km: params.radiusKm,
    segments: params.segments,
    quantity_requested: params.quantity,
    quantity_found: 0,
    status: "em_andamento",
    created_by: createdBy,
    created_at: new Date().toISOString(),
  });

  let raw;
  try {
    raw = await provider.searchCompanies(params);
  } catch (err) {
    await store.update<ProspectingSearch>(TABLES.prospectingSearches, search.id, { status: "erro" });
    throw err;
  }

  const existingCompanies = await store.list<Company>(TABLES.companies);

  let created = 0;
  let updated = 0;

  for (const rawCompany of raw) {
    const dedupeKey = buildDedupeKey(rawCompany);
    const duplicate = findDuplicate(rawCompany, existingCompanies);

    const site = await analyzeSite(rawCompany);
    const scoreResult = computeScore(rawCompany, site, settings);
    const reasons = buildReasons(rawCompany, site, scoreResult.breakdown);
    const approach = generateApproach(rawCompany, site);

    let company: Company;
    if (duplicate) {
      company = await store.update<Company>(TABLES.companies, duplicate.id, {
        name: rawCompany.name,
        category: rawCompany.category,
        city: rawCompany.city,
        state: rawCompany.state,
        address: rawCompany.address,
        phone: rawCompany.phone,
        whatsapp: rawCompany.whatsapp,
        website: rawCompany.website,
        instagram: rawCompany.instagram,
        facebook: rawCompany.facebook,
        google_profile_url: rawCompany.google_profile_url,
        rating: rawCompany.rating,
        reviews_count: rawCompany.reviews_count,
        opening_hours: rawCompany.opening_hours,
        source: rawCompany.source,
        collected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      company = await store.insert<Company>(TABLES.companies, {
        name: rawCompany.name,
        category: rawCompany.category,
        city: rawCompany.city,
        state: rawCompany.state,
        address: rawCompany.address,
        phone: rawCompany.phone,
        whatsapp: rawCompany.whatsapp,
        website: rawCompany.website,
        instagram: rawCompany.instagram,
        facebook: rawCompany.facebook,
        google_profile_url: rawCompany.google_profile_url,
        rating: rawCompany.rating,
        reviews_count: rawCompany.reviews_count,
        opening_hours: rawCompany.opening_hours,
        source: rawCompany.source,
        collected_at: new Date().toISOString(),
        dedupe_key: dedupeKey,
        is_demo_data: rawCompany.is_demo_data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      existingCompanies.push(company);
    }

    await store.insert<LeadSource>(TABLES.leadSources, {
      company_id: company.id,
      search_id: search.id,
      source_name: rawCompany.source,
      source_ref: rawCompany.google_profile_url,
      created_at: new Date().toISOString(),
    });

    const existingLeads = await store.list<Lead>(TABLES.leads, { where: { company_id: company.id } });
    const existingLead = existingLeads[0];

    let lead: Lead;
    if (existingLead) {
      lead = await store.update<Lead>(TABLES.leads, existingLead.id, {
        search_id: search.id,
        segment: rawCompany.category,
        score: scoreResult.score,
        temperature: scoreResult.temperature,
        site_analysis: site,
        reasons,
        approach_suggestion: approach,
        updated_at: new Date().toISOString(),
      });
      updated++;
    } else {
      lead = await store.insert<Lead>(TABLES.leads, {
        company_id: company.id,
        search_id: search.id,
        segment: rawCompany.category,
        score: scoreResult.score,
        temperature: scoreResult.temperature,
        status: "novo",
        assigned_to: null,
        site_analysis: site,
        reasons,
        approach_suggestion: approach,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      created++;
    }

    await store.insert<LeadScore>(TABLES.leadScores, {
      lead_id: lead.id,
      score: scoreResult.score,
      breakdown: scoreResult.breakdown,
      temperature: scoreResult.temperature,
      computed_at: new Date().toISOString(),
    });
  }

  const finishedSearch = await store.update<ProspectingSearch>(TABLES.prospectingSearches, search.id, {
    quantity_found: raw.length,
    status: "concluida",
  });

  return {
    search: finishedSearch,
    leadsCreated: created,
    leadsUpdated: updated,
    totalLeads: raw.length,
    usingDemoData: raw[0]?.is_demo_data ?? false,
    providerName: provider.name,
  };
}
