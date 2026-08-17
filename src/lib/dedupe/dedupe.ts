import type { RawCompany } from "@/lib/data-providers/types";
import type { Company } from "@/types";

// Duplicate detection: combines normalized name + phone + address + website
// domain into a stable key so the same real-world business found across
// multiple searches updates one record instead of creating duplicates.

function normalize(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function domainOf(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return normalize(url);
  }
}

export function buildDedupeKey(company: RawCompany): string {
  const namePart = normalize(company.name).slice(0, 40);
  const phonePart = normalize(company.phone ?? company.whatsapp);
  const addressPart = normalize(company.address).slice(0, 30);
  const domainPart = domainOf(company.website);
  // Prefer the strongest identifiers available; fall back progressively.
  return [namePart, phonePart, addressPart, domainPart].filter(Boolean).join("|");
}

/** Finds an existing company that looks like the same real-world business. */
export function findDuplicate(candidate: RawCompany, existing: Company[]): Company | null {
  const candidateKey = buildDedupeKey(candidate);
  const candidatePhone = normalize(candidate.phone ?? candidate.whatsapp);
  const candidateDomain = domainOf(candidate.website);
  const candidateName = normalize(candidate.name);

  for (const company of existing) {
    if (company.dedupe_key === candidateKey) return company;
    if (candidatePhone && normalize(company.phone ?? company.whatsapp) === candidatePhone) return company;
    if (candidateDomain && domainOf(company.website) === candidateDomain) return company;
    if (
      candidateName &&
      normalize(company.name) === candidateName &&
      company.city.toLowerCase() === candidate.city.toLowerCase()
    ) {
      return company;
    }
  }
  return null;
}
