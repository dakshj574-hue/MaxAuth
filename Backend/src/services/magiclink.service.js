/**
 * magiclink.service.js
 * Imports: models/user.model.js, utils/mailer.js, utils/jwt.js, config/env.js
 * Imported by: controllers/magiclink.controller.js
 */

import { findUserByEmail, createUser, updateUser } from '../models/user.model.js'
import { sendEmail } from '../utils/mailer.js'
import { signAccessToken, verifyToken } from '../utils/jwt.js'
import { env } from '../config/env.js'

export const sendMagicLink = async ({ email, projectId }) => {
  try {
    let user = await findUserByEmail(email, projectId)

    // Auto-create user if they don't exist (passwordless flow)
    if (!user) {
      user = await createUser({
        email,
        username: email.split('@')[0],
        passwordHash: null,
        loginMethods: ['magic'],
        isLocked: false,
        lockUntil: null,
        projectId
      })
    } else if (!user.loginMethods.includes('magic')) {
      await updateUser(user.id, {
        loginMethods: [...user.loginMethods, 'magic']
      })
    }

    // Sign a short-lived magic link token including projectId
    const token = signAccessToken(
      { userId: user.id, email: user.email, type: 'magic', projectId },
      env.MAGIC_LINK_SECRET,
      env.MAGIC_LINK_EXPIRY
    )

    const magicUrl = `${env.CLIENT_URL}/magic-verify?token=${token}`

    await sendEmail({
      to: email,
      subject: 'Your SecureAuth Magic Link',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2>Sign in to SecureAuth</h2>
          <p>Click the button below to sign in. This link expires in 15 minutes.</p>
          <a href="${magicUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #4F46E5;
            color: white;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          ">Sign In</a>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `
    })

    return { email }
  } catch (err) {
    throw new Error(`Failed to send magic link: ${err.message}`)
  }
}

export const verifyMagicLink = async ({ token }) => {
  try {
    let payload
    try {
      payload = verifyToken(token, env.MAGIC_LINK_SECRET)
    } catch {
      throw new Error('Invalid or expired magic link')
    }

    if (payload.type !== 'magic') throw new Error('Invalid token type')

    const user = await findUserByEmail(payload.email, payload.projectId)
    if (!user) throw new Error('User not found')
    if (user.isLocked) throw new Error('Account is locked')

    return { userId: user.id, email: user.email, projectId: payload.projectId }
  } catch (err) {
    throw new Error(`Magic link verification failed: ${err.message}`)
  }
}
