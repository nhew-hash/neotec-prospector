import type { DataProvider } from "./types";
import { MockDataProvider } from "./mock-provider";
import { GooglePlacesProvider } from "./google-places-provider";

export type { DataProvider, ProspectingParams, RawCompany } from "./types";

const googlePlaces = new GooglePlacesProvider();
const mock = new MockDataProvider();

/**
 * Returns the DataProvider to use for prospecting. Prefers Google Places
 * when GOOGLE_PLACES_API_KEY is set; otherwise falls back to the
 * demonstration provider so the product is fully usable out of the box.
 */
export function getDataProvider(): DataProvider {
  if (googlePlaces.isConfigured()) return googlePlaces;
  return mock;
}

export function isUsingDemoData(): boolean {
  return getDataProvider().name === mock.name;
}
