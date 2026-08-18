import type { DataProvider, ProspectingParams, RawCompany } from "./types";
import { SEGMENTOS_DISPONIVEIS } from "@/lib/config/default-settings";

// Real implementation using the Places API (New) Text Search endpoint.
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
//
// Requires GOOGLE_PLACES_API_KEY (see .env.example) with the "Places API
// (New)" enabled on the associated Google Cloud project (and billing
// enabled — Google requires a billing account even within the free
// monthly credit).
//
// Design notes:
//  - We search per segment (one Text Search call per segment, e.g.
//    "Restaurantes em Araguari, MG, Brasil") because a single free-text
//    query can't reliably express "any of these N categories" — Google's
//    ranking treats the whole string as one topic.
//  - Only fields that Google actually returns are used. Instagram,
//    Facebook and WhatsApp are never provided by Places, so those fields
//    are always left `null` — never invented, per the project's core rule.
//  - `website` absent in Google's response is what drives the "sem site"
//    signal. Google's own business-profile data is treated as reliable
//    for that (`source_reliable: true`), same bar the rest of the app
//    already assumes for a real source.
//  - Pagination: Places Text Search returns up to 20 results per call and
//    a `nextPageToken` for more. We follow it (Google recommends a short
//    delay before a page token becomes usable) up to a small cap so one
//    search doesn't run away in cost/time — "poucos leads, mas bons" means
//    we don't need to exhaust every page anyway.

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.regularOpeningHours",
  "places.businessStatus",
  "nextPageToken",
].join(",");

interface PlacesApiPlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  businessStatus?: string;
}

interface PlacesApiResponse {
  places?: PlacesApiPlace[];
  nextPageToken?: string;
  error?: { message?: string; status?: string };
}

const MAX_PAGES_PER_SEGMENT = 3; // up to 60 results per segment
const PAGE_TOKEN_DELAY_MS = 2000; // Google needs a short delay before a page token is valid

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchTextPage(
  apiKey: string,
  body: Record<string, unknown>
): Promise<PlacesApiResponse> {
  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as PlacesApiResponse;

  if (!res.ok) {
    const message = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return json;
}

async function searchSegment(
  apiKey: string,
  segment: string,
  params: ProspectingParams,
  remaining: number
): Promise<PlacesApiPlace[]> {
  const textQuery = `${segment} em ${params.city}, ${params.state}, Brasil`;
  const results: PlacesApiPlace[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES_PER_SEGMENT && results.length < remaining; page++) {
    if (pageToken) await sleep(PAGE_TOKEN_DELAY_MS);

    const body: Record<string, unknown> = pageToken
      ? { textQuery, pageToken, languageCode: "pt-BR" }
      : {
          textQuery,
          languageCode: "pt-BR",
          regionCode: "BR",
          maxResultCount: 20,
        };

    const page_ = await searchTextPage(apiKey, body);
    results.push(...(page_.places ?? []));

    if (!page_.nextPageToken) break;
    pageToken = page_.nextPageToken;
  }

  return results;
}

function mapPlaceToRawCompany(place: PlacesApiPlace, segment: string, params: ProspectingParams): RawCompany {
  return {
    name: place.displayName?.text || "Empresa sem nome no Google",
    category: segment,
    city: params.city,
    state: params.state,
    address: place.formattedAddress ?? null,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    // Google Places never returns a WhatsApp-specific number — never invented.
    whatsapp: null,
    website: place.websiteUri ?? null,
    // Instagram/Facebook are not part of the Places API response.
    instagram: null,
    facebook: null,
    google_profile_url: place.googleMapsUri ?? null,
    rating: typeof place.rating === "number" ? place.rating : null,
    reviews_count: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    opening_hours: place.regularOpeningHours?.weekdayDescriptions?.join(" · ") ?? null,
    source: "Google Places API",
    source_reliable: true,
    is_demo_data: false,
  };
}

export class GooglePlacesProvider implements DataProvider {
  name = "Google Places API";

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_PLACES_API_KEY);
  }

  async searchCompanies(params: ProspectingParams): Promise<RawCompany[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_PLACES_API_KEY não configurada. Adicione a chave nas variáveis de ambiente para " +
          "usar dados reais do Google Places, ou continue usando o provedor de demonstração."
      );
    }

    const segments =
      !params.segments.length || params.segments.includes("Todos os segmentos")
        ? SEGMENTOS_DISPONIVEIS.filter((s) => s !== "Outros")
        : params.segments;

    const perSegmentTarget = Math.max(5, Math.ceil(params.quantity / segments.length));

    const seenPlaceIds = new Set<string>();
    const raw: RawCompany[] = [];

    for (const segment of segments) {
      if (raw.length >= params.quantity) break;
      let places: PlacesApiPlace[];
      try {
        places = await searchSegment(apiKey, segment, params, perSegmentTarget);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Falha ao consultar o Google Places para "${segment}": ${message}. ` +
            `Verifique se a chave GOOGLE_PLACES_API_KEY é válida, se a "Places API (New)" está ` +
            `ativada no projeto do Google Cloud e se o faturamento (billing) está habilitado.`
        );
      }

      for (const place of places) {
        if (raw.length >= params.quantity) break;
        if (seenPlaceIds.has(place.id)) continue;
        seenPlaceIds.add(place.id);
        if (place.businessStatus && place.businessStatus !== "OPERATIONAL") continue;
        raw.push(mapPlaceToRawCompany(place, segment, params));
      }
    }

    return raw;
  }
}
