import { Resend } from 'resend';
import { env } from '../config/env.js';

let resend;

async function initMailer() {
  if (resend) return resend;

  if (!env.RESEND_API_KEY) {
    console.error('\n❌ [CRITICAL ERROR] LIVE EMAIL NOT CONFIGURED!');
    console.error('To send emails to your real inbox, you must update RESEND_API_KEY in your backend .env file.\n');
    throw new Error('Live Email Provider not configured');
  }

  resend = new Resend(env.RESEND_API_KEY);

  console.log('✉️  Live Resend Email Client Connected!');
  return resend;
}

const sendWithRetry = async (mailer, mailOptions, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data, error } = await mailer.emails.send(mailOptions);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    } catch (error) {
      console.error(`[Resend] Attempt ${i + 1} failed: ${error.message}`);
      if (i === retries) throw new Error(`Email dispatch failed after ${retries} retries: ${error.message}`);
      await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
    }
  }
};

/**
 * Sends a magic link email
 * @param {string} email 
 * @param {string} magicLink 
 */
export const sendMagicLinkEmail = async (email, magicLink) => {
  const mailer = await initMailer();

  await sendWithRetry(mailer, {
    from: env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email, // Dynamic recipient
    subject: "Your Magic Login Link 🪄",
    text: `You requested a magic link to access your vault. Click here to login: ${magicLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e1e8fd; border-radius: 16px; background-color: #f9f9ff;">
        <h2 style="color: #1e3a8a; margin-top: 0;">MaxAuth Security Vault</h2>
        <p style="color: #444651; font-size: 16px; line-height: 1.5;">You recently requested a secure, passwordless magic link to sign in to your account.</p>
        
        <div style="margin: 35px 0; text-align: center;">
          <a href="${magicLink}" style="background-color: #00236f; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 35, 111, 0.2);">Instantly Sign In</a>
        </div>
        
        <p style="color: #757682; font-size: 14px;">Or copy and paste this URL into your browser:</p>
        <p style="color: #757682; font-size: 12px; word-break: break-all; background: #e9edff; padding: 10px; border-radius: 4px;">${magicLink}</p>
        
        <hr style="border: 0; border-top: 1px solid #c5c5d3; margin: 30px 0;">
        <p style="color: #757682; font-size: 11px;">This link is valid for a single use and will automatically expire in 15 minutes. If you did not request this, please ignore this email securely.</p>
      </div>
    `,
  });

  console.log(`\n=============================================================`);
  console.log(`✉️   LIVE MAGIC LINK DISPATCHED TO INDIVIDUAL INBOX: ${email}`);
  console.log(`=============================================================\n`);

  return true;
};

export const sendEmail = async (email, subject, text, html) => {
  const mailer = await initMailer();

  await sendWithRetry(mailer, {
    from: env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email, // Dynamic recipient
    subject,
    text,
    html: html || text
  });

  console.log(`\n=============================================================`);
  console.log(`✉️   LIVE OTP EMAIL DISPATCHED TO: ${email}`);
  console.log(`=============================================================\n`);
  return true;
};
