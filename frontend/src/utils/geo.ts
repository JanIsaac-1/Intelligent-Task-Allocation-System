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
