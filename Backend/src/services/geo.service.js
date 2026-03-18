/**
 * geo.service.js
 * Imports: none (uses fetch — native in Node 18+)
 * Imported by: services/suspicious.service.js
 * Pure business logic — no DB, no req/res, no process.env
 */

const GEO_API_BASE = 'http://ip-api.com/json'

/**
 * Fetches geolocation data for an IP address from ip-api.com.
 * Returns null gracefully on failure — never crashes the caller.
 * @param {string} ip
 * @returns {Promise<{ country: string, city: string, lat: number, lon: number }|null>}
 */
export const fetchGeoData = async (ip) => {
  try {
    // Skip lookup for local/private IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: 'Local', city: 'Local', lat: 0, lon: 0 }
    }

    const response = await fetch(`${GEO_API_BASE}/${ip}?fields=status,country,city,lat,lon`)
    if (!response.ok) return null

    const data = await response.json()
    if (data.status !== 'success') return null

    return {
      country: data.country || 'Unknown',
      city: data.city || 'Unknown',
      lat: data.lat ?? 0,
      lon: data.lon ?? 0
    }
  } catch {
    // Network errors must not break the auth flow
    return null
  }
}
