/**
 * Computes great circle distance between two points in kilometers
 * using the Haversine formula (as specified in project proposal section 3.5.5)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Normalizes distance into a proximity score between 0.0 and 1.0
 * Maximum effective radius considered is 25km.
 */
export function calculateProximityScore(distanceKm: number, maxRadiusKm = 25): number {
  if (distanceKm <= 0.2) return 1.0; // Right next door
  if (distanceKm >= maxRadiusKm) return 0.05; // Outside standard operational zone
  // Smooth non-linear decay
  return Math.max(0.05, 1 - (distanceKm / maxRadiusKm));
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// In-memory cache for reverse geocoding to prevent excessive network calls
const geocodeCache = new Map<string, string>();

/**
 * Resolves a human-readable street/estate name from geographic coordinates
 * using OpenStreetMap Nominatim reverse geocoding with in-memory caching.
 */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<string> {
  if (isNaN(lat) || isNaN(lng)) return 'Unknown Location';

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // Primary: Photon (OpenStreetMap data without strict 1 req/sec 429 browser ban)
  try {
    const photonRes = await fetch(
      `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`
    );
    if (photonRes.ok) {
      const pData = await photonRes.json();
      const props = pData?.features?.[0]?.properties;
      if (props) {
        const parts = [props.street || props.name, props.locality || props.district, props.city || props.state].filter(Boolean);
        const unique = Array.from(new Set(parts));
        if (unique.length > 0) {
          const finalName = unique.slice(0, 3).join(', ');
          geocodeCache.set(cacheKey, finalName);
          return finalName;
        }
      }
    }
  } catch {
    // Fall through to Nominatim
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.display_name) {
        const parts = data.display_name.split(',');
        const concise = parts.slice(0, 3).join(',').trim();
        const finalName = concise || data.display_name;
        geocodeCache.set(cacheKey, finalName);
        return finalName;
      }
    }
  } catch {
    // Fall through to BigDataCloud
  }

  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const parts = [data.locality, data.city, data.principalSubdivision].filter(Boolean);
      const unique = Array.from(new Set(parts));
      if (unique.length > 0) {
        const finalName = unique.join(', ');
        geocodeCache.set(cacheKey, finalName);
        return finalName;
      }
    }
  } catch {
    // Network failure: gracefully fall back to coordinates
  }

  return `Pinned Site (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

export interface PlaceSuggestion {
  id: string;
  label: string;
  secondaryText: string;
  fullName: string;
  lat: number;
  lng: number;
}

const placeSearchCache = new Map<string, PlaceSuggestion[]>();

/**
 * Autocomplete / typeahead place search using Photon (with Nairobi location bias)
 * and OpenStreetMap Nominatim fallback.
 */
export async function searchPlaceSuggestions(
  rawQuery: string,
  limit = 6,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const cacheKey = `${query.toLowerCase()}::${limit}`;
  const cached = placeSearchCache.get(cacheKey);
  if (cached) return cached;

  // 1. Primary: Photon autocomplete biased toward Nairobi / Kenya
  try {
    const photonUrl =
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
      `&limit=${limit}&lat=-1.2921&lon=36.8219&lang=en`;
    const res = await fetch(photonUrl, { signal });
    if (res.ok) {
      const data = await res.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      const seen = new Set<string>();
      const suggestions: PlaceSuggestion[] = [];

      for (let i = 0; i < features.length; i++) {
        const feat = features[i];
        const coords = feat?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) continue;

        const lng = parseFloat(Number(coords[0]).toFixed(5));
        const lat = parseFloat(Number(coords[1]).toFixed(5));
        const props = feat.properties || {};

        const primary = props.name || props.street || props.locality || props.district || props.city || query;
        const secondaryParts = [
          props.street && props.street !== primary ? props.street : null,
          props.locality && props.locality !== primary ? props.locality : null,
          props.district && props.district !== primary ? props.district : null,
          props.city && props.city !== primary ? props.city : null,
          props.country && props.country !== primary ? props.country : null,
        ].filter(Boolean) as string[];

        const uniqueSecondary = Array.from(new Set(secondaryParts)).slice(0, 3);
        const secondaryText = uniqueSecondary.join(', ');
        const fullName = [primary, ...uniqueSecondary.slice(0, 2)].filter(Boolean).join(', ');
        const dedupKey = `${fullName.toLowerCase()}@${lat.toFixed(3)},${lng.toFixed(3)}`;

        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        suggestions.push({
          id: `photon-${props.osm_id || i}-${lat}-${lng}`,
          label: primary,
          secondaryText,
          fullName: fullName || primary,
          lat,
          lng,
        });
      }

      if (suggestions.length > 0) {
        placeSearchCache.set(cacheKey, suggestions);
        return suggestions;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    // Fall through to Nominatim
  }

  // 2. Fallback: Nominatim search scoped cleanly for Kenyan addresses/landmarks
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ke&limit=${limit}`,
      { signal }
    );
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const suggestions: PlaceSuggestion[] = results.map((item: any, idx: number) => {
          const lat = parseFloat(parseFloat(item.lat).toFixed(5));
          const lng = parseFloat(parseFloat(item.lon).toFixed(5));
          const parts = String(item.display_name || query)
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean);
          const primary = parts[0] || query;
          const secondary = parts.slice(1, 4).join(', ');
          const concise = parts.slice(0, 3).join(', ') || item.display_name;
          return {
            id: `nom-${item.place_id || idx}`,
            label: primary,
            secondaryText: secondary,
            fullName: concise,
            lat,
            lng,
          };
        });
        placeSearchCache.set(cacheKey, suggestions);
        return suggestions;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
  }

  return [];
}
