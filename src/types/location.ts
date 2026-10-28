export interface LocationInfo {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  isCurrentLocation?: boolean;
}

export interface GeocodingResultItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  country_code?: string;
}

export interface GeocodingApiResponse {
  results?: GeocodingResultItem[];
  generationtime_ms?: number;
}
