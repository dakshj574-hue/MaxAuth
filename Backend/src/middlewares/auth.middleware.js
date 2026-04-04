/**
 * auth.middleware.js
 * Imports: utils/jwt.js, utils/apiResponse.js, config/env.js
 * Imported by: all protected routes via routes/*.js
 */

import { verifyToken } from '../utils/jwt.js'
import { errorResponse } from '../utils/apiResponse.js'
import { env } from '../config/env.js'

export const verifyAccessToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Access token missing or malformed'))
    }

    const token = authHeader.split(' ')[1]

    let payload
    try {
      payload = verifyToken(token, env.JWT_ACCESS_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json(errorResponse('Access token expired'))
      }
      return res.status(401).json(errorResponse('Invalid access token'))
    }

    req.user = payload  // { userId, email, iat, exp }
    next()
  } catch (err) {
    next(err)
  }
}
