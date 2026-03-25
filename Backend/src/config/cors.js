
import cors from 'cors'
import { env } from './env.js'

const allowedOrigins = [env.CLIENT_URL, `http://localhost:${env.PORT}`, 'http://localhost:5173', 'http://localhost:3000']

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`CORS: Origin '${origin}' is not allowed`), false)
  },

  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 600
}
export const corsMiddleware = cors(corsOptions)
