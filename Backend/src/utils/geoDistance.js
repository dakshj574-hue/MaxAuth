/**
 * geoDistance.js
 * Imports: none (pure math)
 * Imported by: services/suspicious.service.js
 *
 * Uses the Haversine formula to compute great-circle distance in kilometres.
 */

const EARTH_RADIUS_KM = 6371

/**
 * Converts degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
const toRad = (deg) => (deg * Math.PI) / 180

/**
 * Calculates the distance in kilometres between two geographical coordinates.
 * @param {{ lat: number, lon: number }} pointA
 * @param {{ lat: number, lon: number }} pointB
 * @returns {number} Distance in kilometres
 */
export const calculateGeoDistance = (pointA, pointB) => {
  if (
    pointA?.lat == null || pointA?.lon == null ||
    pointB?.lat == null || pointB?.lon == null
  ) {
    return Infinity
  }

  const dLat = toRad(pointB.lat - pointA.lat)
  const dLon = toRad(pointB.lon - pointA.lon)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pointA.lat)) *
    Math.cos(toRad(pointB.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}
