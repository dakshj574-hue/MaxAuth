/**
 * deviceInfo.js
 * Imports: ua-parser-js
 * Imported by: services/session.service.js
 *
 * Install: npm install ua-parser-js
 */

import { UAParser } from 'ua-parser-js'

/**
 * Parses a User-Agent string into structured device info.
 * @param {string} userAgent
 * @returns {{ browser: string, os: string, device: string }}
 */
export const parseDeviceInfo = (userAgent = '') => {
  try {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    const browser = [result.browser.name, result.browser.version]
      .filter(Boolean)
      .join(' ') || 'Unknown Browser'

    const os = [result.os.name, result.os.version]
      .filter(Boolean)
      .join(' ') || 'Unknown OS'

    const device = result.device.type
      ? `${result.device.type} ${result.device.vendor || ''}`.trim()
      : 'Desktop'

    return { browser, os, device }
  } catch {
    return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' }
  }
}
