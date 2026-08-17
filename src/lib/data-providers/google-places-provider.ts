import type { DataProvider, ProspectingParams, RawCompany } from "./types";

// Stub implementation, ready to be filled in once the Neotec team has an
// authorized Google Places API key. Wired up so that turning it on is a
// matter of setting GOOGLE_PLACES_API_KEY — no other code needs to change.
//
// Required env var (see .env.example): GOOGLE_PLACES_API_KEY
//
// Suggested implementation once the key is available:
//   1. Text Search / Nearby Search (places.googleapis.com) using city+state
//      geocoded to lat/lng, radius = radiusKm * 1000, keyword = segment.
//   2. Place Details for each result to fetch phone, website, opening hours,
//      rating and rating count.
//   3. Map the response into RawCompany, leaving fields Google doesn't
//      return (e.g. Instagram/Facebook/WhatsApp) as null — never invented.
export class GooglePlacesProvider implements DataProvider {
  name = "Google Places API";

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_PLACES_API_KEY);
  }

  async searchCompanies(_params: ProspectingParams): Promise<RawCompany[]> {
    if (!this.isConfigured()) {
      throw new Error(
        "GOOGLE_PLACES_API_KEY não configurada. Adicione a chave no .env para usar dados reais do Google Places, " +
          "ou continue usando o provedor de demonstração em Configurações."
      );
    }
    // Not implemented yet — intentionally left as a clear extension point.
    throw new Error(
      "Integração com Google Places ainda não implementada nesta versão. " +
        "A chave foi detectada, mas o código de chamada à API precisa ser adicionado em " +
        "src/lib/data-providers/google-places-provider.ts."
    );
  }
}
