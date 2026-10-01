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
