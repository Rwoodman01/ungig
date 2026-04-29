/**
 * Client-side geo matching: Haversine distance + max radius from `maxDistanceMiles`.
 * User docs store `location: { name, lat, lng }` and optional `coordinates` (GeoPoint)
 * for future GeoFirestore-style geospatial indexes at scale.
 */
/** Earth radius in miles for Haversine distance. */
const R_MI = 3958.8;

/**
 * Great-circle distance in miles between two WGS84 points.
 */
export function haversineMiles(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) ** 2
    + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_MI * c;
}

/** @param {Record<string, unknown> | null | undefined} userDoc */
export function getUserLatLng(userDoc) {
  const loc = userDoc?.location;
  if (loc && typeof loc === 'object') {
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

/** Human-readable place name (new shape or legacy string). */
export function getLocationDisplayName(userDoc) {
  const loc = userDoc?.location;
  if (loc && typeof loc === 'object' && loc.name != null) {
    return String(loc.name).trim();
  }
  if (typeof loc === 'string') return loc.trim();
  return '';
}

/** @returns {{ name: string, lat: number | null, lng: number | null }} */
export function initialLocationFromUserDoc(userDoc) {
  const loc = userDoc?.location;
  if (loc && typeof loc === 'object' && loc.name != null) {
    return {
      name: String(loc.name),
      lat: loc.lat != null ? Number(loc.lat) : null,
      lng: loc.lng != null ? Number(loc.lng) : null,
    };
  }
  if (typeof loc === 'string' && loc.trim()) {
    return { name: loc.trim(), lat: null, lng: null };
  }
  return { name: '', lat: null, lng: null };
}

/**
 * @param {number | null | undefined} miles
 * @returns {string} e.g. "2.4 miles away" or "Location not set"
 */
export function formatDistanceMilesLabel(miles) {
  if (miles == null || !Number.isFinite(miles)) return 'Location not set';
  if (miles < 0.05) return 'Nearby';
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} miles away`;
}

/**
 * Effective max distance (miles).
 * - Field missing → default 25.
 * - `maxDistanceMiles: null` → Anywhere (no cap).
 */
export function getEffectiveMaxDistanceMiles(userDoc) {
  if (!userDoc || !Object.prototype.hasOwnProperty.call(userDoc, 'maxDistanceMiles')) {
    return 25;
  }
  if (userDoc.maxDistanceMiles === null) return Infinity;
  const n = Number(userDoc.maxDistanceMiles);
  return Number.isFinite(n) && n > 0 ? n : 25;
}
