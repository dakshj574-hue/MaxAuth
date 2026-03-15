/**
 * mailer.js
 * Imports: resend, config/env.js
 * Imported by: services/magiclink.service.js
 *
 * Install: npm install resend
 */

import { Resend } from 'resend';
import { env } from '../config/env.js';

let resend = null;

const getResend = () => {
  if (!resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing');
    }
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Sends an email.
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const resendClient = getResend();
    const { data, error } = await resendClient.emails.send({
      from: env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, '')  // plaintext fallback
    });

    if (error) {
      throw new Error(error.message);
    }
    return data;
  } catch (err) {
    throw new Error(`Email send failed: ${err.message}`);
  }
}
