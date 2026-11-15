import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const isProduction = process.env.NODE_ENV === 'production'
const DEV_SECRET = 'dev-secret-change-me'

/** Comma-separated list of frontend addresses allowed to call the API with cookies. */
function corsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN || (isProduction ? '' : 'http://localhost:5173,http://127.0.0.1:5173')
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export const config = {
  isProduction,
  port: parseInt(process.env.PORT || '8000', 10),
  host: process.env.HOST || '0.0.0.0',
  sessionSecret: process.env.SESSION_SECRET || DEV_SECRET,
  corsOrigins: corsOrigins(),
  /**
   * Frontend and API on different sites (e.g. two onrender.com addresses) need 'none' so the
   * browser sends the session cookie; 'none' requires HTTPS (secure cookies) — production only.
   */
  cookieSameSite: (process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax')) as
    'lax' | 'strict' | 'none',
  /** First Owner account, created only when the users table is empty. */
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  databaseUrl: process.env.DATABASE_URL || null,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    database: process.env.DB_NAME || 'accounting',
    user: process.env.DB_USER || 'accounting_app',
    password: process.env.DB_PASSWORD || '',
  },
}

/** Refuse to run in production with settings that would leave the system open. */
export function assertSafeConfig(): void {
  if (!config.isProduction) return
  const problems: string[] = []
  if (config.sessionSecret === DEV_SECRET || config.sessionSecret.length < 32)
    problems.push('SESSION_SECRET must be set to a long random value (32+ characters).')
  if (config.corsOrigins.length === 0)
    problems.push('CORS_ORIGIN must list the frontend address, e.g. https://accounting-frontend.onrender.com')
  if (problems.length) throw new Error(`Unsafe production configuration:\n- ${problems.join('\n- ')}`)
}
