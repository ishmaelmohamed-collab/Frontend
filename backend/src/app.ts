import express from 'express'
import session from 'express-session'
import pinoHttp from 'pino-http'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import { pool } from './db'
import { config } from './config'
import { logger } from './logger'
import authRoutes from './routes/auth'
import apiRoutes from './routes/api'
import pageRoutes from './routes/pages'

const connectPgSimpleFactory = require('connect-pg-simple')
const pgSession = connectPgSimpleFactory(session)

const app = express()

// Render, Docker and most hosts sit behind a proxy: needed for secure cookies and rate limiting by IP.
app.set('trust proxy', 1)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Only the listed frontend addresses may call this API with session cookies (CORS_ORIGIN).
app.use(
  cors({
    credentials: true,
    origin: (origin, done) => {
      // Same-origin requests and tools like curl send no Origin header.
      if (!origin || config.corsOrigins.includes(origin.replace(/\/$/, ''))) return done(null, true)
      return done(null, false)
    },
  }),
)

// Structured request logging
app.use(pinoHttp({ logger }))

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProduction, // HTTPS only in production
      sameSite: config.cookieSameSite,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
)

// Rate limiting: stricter for login, general for the rest of the API
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, try again later.' },
})
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later.' },
})

app.use('/api/auth/login', loginLimiter)
app.use('/api', apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api', apiRoutes)
app.use('/', pageRoutes)

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err: err.message, stack: err.stack }, 'unhandled error')
  // Never send internal details (SQL, stack) to the browser in production.
  res
    .status(500)
    .json({ error: config.isProduction ? 'Internal server error' : err.message || 'Internal server error' })
})

export default app
