// DataProvider is the abstraction boundary between the app and whatever
// external source actually finds real companies (Google Places, other
// authorized directories/APIs, etc). Nothing in the scoring/lead layer
// depends on a specific provider — swap the implementation in
// `index.ts` once real API credentials are available.

export interface ProspectingParams {
  city: string;
  state: string;
  radiusKm: number;
  segments: string[]; // empty/["Todos os segmentos"] = all
  quantity: number;
}

// Raw fields as they come back from a source, BEFORE our own site
// analysis / scoring runs. Any field the source could not find must be
// `null` — providers must never invent data.
export interface RawCompany {
  name: string;
  category: string;
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  google_profile_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  opening_hours: string | null;
  source: string;
  /** true when the absence of certain fields (e.g. website) can be trusted */
  source_reliable: boolean;
  is_demo_data: boolean;
}

export interface DataProvider {
  /** Human readable name, stored as lead_sources.source_name */
  name: string;
  isConfigured(): boolean;
  searchCompanies(params: ProspectingParams): Promise<RawCompany[]>;
}
