/**
 * suspicious.service.js
 * Imports: models/suspiciousEvent.model.js, models/loginAttempt.model.js,
 *          services/geo.service.js, utils/geoDistance.js
 * Pure business logic — no req/res, no process.env
 */

import { createSuspiciousEvent, findSuspiciousEventsByUserId, findAllSuspiciousEvents } from '../models/suspiciousEvent.model.js'
import { countRecentAttempts } from '../models/loginAttempt.model.js'
import { fetchGeoData } from './geo.service.js'
import { calculateGeoDistance } from '../utils/geoDistance.js'

// Thresholds for Task 3 strengthening
const IMPOSSIBLE_TRAVEL_SPEED_KMH_THRESHOLD = 900 // Commercial jets fly ~900 km/h max
const RAPID_ATTEMPT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RAPID_ATTEMPT_COUNT_THRESHOLD = 10 // More than 10 attempts in 1 hr

export const getProjectSuspiciousEvents = async (projectId) => {
  return await findAllSuspiciousEvents(projectId); // For admin dashboard
}

export const detectSuspiciousActivity = async ({ userId, email, ip, userAgent, projectId }) => {
  try {
    const currentGeo = await fetchGeoData(ip)
    
    // Default location shape
    const locationObj = currentGeo || { country: 'Local', city: 'Local', lat: 0, lon: 0 }

    await Promise.allSettled([
      checkImpossibleTravelAndDeviceChange({ userId, ip, userAgent, currentGeo: locationObj, projectId }),
      checkExcessiveAttempts({ userId, email, ip, userAgent, currentGeo: locationObj, projectId })
    ])
  } catch {
    // Silent failure — never interrupt auth
  }
}

// ─── Private Checkers ─────────────────────────────────────────────────────────

// Combined Checker: Geographic Impossibility (Task 3: Speed > 900km/h), Unrecognized Device, Unrecognized Location
const checkImpossibleTravelAndDeviceChange = async ({ userId, ip, userAgent, currentGeo, projectId }) => {
  try {
    const recentEvents = await findSuspiciousEventsByUserId(userId, projectId, 20)
    
    // We assume legitimate login creates a session, which we can check, but for now we look at recent logins
    // We use the last event to check for changes
    // Alternatively, tracking baseline normal devices/locations is better. 
    // We fetch the most recent log of ANY kind from this user to compare time and distance.
    const lastEvent = recentEvents[0]; 

    let actionTaken = 'LOGGED'
    
    if (lastEvent) {
      if (lastEvent.location?.lat != null && lastEvent.location?.lon != null && lastEvent.location.country !== 'Local' && currentGeo.country !== 'Local') {
        const distance = calculateGeoDistance(
          { lat: lastEvent.location.lat, lon: lastEvent.location.lon },
          { lat: currentGeo.lat, lon: currentGeo.lon }
        )
        
        // Calculate speed (km/h)
        const timeDiffHours = (Date.now() - (lastEvent.timestamp.toDate ? lastEvent.timestamp.toDate().getTime() : new Date(lastEvent.timestamp).getTime())) / (1000 * 60 * 60);

        if (timeDiffHours > 0 && distance > 50) { // Small distances might have IP jumps, ignore if < 50km
            const speed = distance / timeDiffHours;
            
            if (speed > IMPOSSIBLE_TRAVEL_SPEED_KMH_THRESHOLD) {
                await createSuspiciousEvent({
                    userId,
                    projectId,
                    type: 'IMPOSSIBLE_TRAVEL',
                    ip,
                    device: userAgent,
                    location: currentGeo,
                    description: `Logged in from ${currentGeo.city}, ${currentGeo.country}. Actual travel speed between this and last event: ${Math.round(speed)} km/h. Distance: ${Math.round(distance)} km over ${timeDiffHours.toFixed(2)} hours.`,
                    actionTaken: 'FLAGGED_HIGH_RISK'
                })
                return; // Early return to avoid flooding with lower tier alerts
            }
        }
      }
      
      // Unrecognized Device Check
      if (lastEvent.device && userAgent && lastEvent.device !== userAgent) {
         await createSuspiciousEvent({
            userId,
            projectId,
            type: 'UNRECOGNIZED_DEVICE',
            ip,
            device: userAgent,
            location: currentGeo,
            description: `New device or browser detected. Was: ${lastEvent.device.substring(0,20)}... Now: ${userAgent.substring(0,20)}...`,
            actionTaken: 'LOGGED'
         })
      }
      
      // Unrecognized Location Check
      if (lastEvent.location?.city !== currentGeo.city && currentGeo.city !== 'Local' && lastEvent.location?.city) {
         await createSuspiciousEvent({
            userId,
            projectId,
            type: 'UNRECOGNIZED_LOCATION',
            ip,
            device: userAgent,
            location: currentGeo,
            description: `Login from unrecognized location: ${currentGeo.city}, ${currentGeo.country} (Previous: ${lastEvent.location.city})`,
            actionTaken: 'LOGGED'
         })
      }

    } else {
      // First login
      await createSuspiciousEvent({
        userId,
        projectId,
        type: 'NEW_LOCATION',
        ip,
        device: userAgent,
        location: currentGeo,
        description: `Baseline established from ${currentGeo.city}, ${currentGeo.country}`,
        actionTaken: 'LOGGED'
      })
    }
  } catch {
    // Silent
  }
}

// 10 failed attempts per hour
export const checkExcessiveAttempts = async ({ userId, email, ip, userAgent, currentGeo, projectId }) => {
  try {
    const attempts = await countRecentAttempts(email, RAPID_ATTEMPT_WINDOW_MS, projectId);

    if (attempts > RAPID_ATTEMPT_COUNT_THRESHOLD) {
      await createSuspiciousEvent({
        userId: userId || 'unknown',
        projectId,
        type: 'EXCESSIVE_FAILURES',
        ip,
        device: userAgent,
        location: currentGeo,
        description: `${attempts} failed login attempts detected for ${email} within the last hour. Threshold is ${RAPID_ATTEMPT_COUNT_THRESHOLD}.`,
        actionTaken: 'ACCOUNT_LOCKED_15_MIN' // auth.service.js handles the actual locking, this is auditory.
      })
    }
  } catch {
    // Silent
  }
}
