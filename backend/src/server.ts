import crypto from 'crypto'
import app from './app'
import { assertSafeConfig, config } from './config'
import { logger } from './logger'
import { query } from './db'
import { hashPassword } from './auth'

/**
 * First start only (no users yet): create the Owner account. The password comes from
 * ADMIN_PASSWORD; if that is not set, a random one is generated and written to the log once.
 * There is no built-in default password.
 */
async function ensureAdminUser(): Promise<void> {
  try {
    const { rows } = await query('SELECT count(*)::int AS n FROM users')
    if (rows[0].n > 0) return
    let password = config.adminPassword
    let generated = false
    if (password && password.length < 10) {
      throw new Error('ADMIN_PASSWORD must be at least 10 characters.')
    }
    if (!password) {
      password = crypto.randomBytes(12).toString('base64url')
      generated = true
    }
    const hash = await hashPassword(password)
    await query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')", [
      config.adminUsername,
      hash,
    ])
    if (generated) {
      logger.warn(
        `First Owner account created: ${config.adminUsername} / ${password} — sign in and change it. This is shown only once.`,
      )
    } else {
      logger.info(`First Owner account created: ${config.adminUsername} (password from ADMIN_PASSWORD).`)
    }
  } catch (e: any) {
    logger.warn(`Could not check/create the first Owner account: ${e.message}`)
  }
}

async function start(): Promise<void> {
  assertSafeConfig()
  await ensureAdminUser()
  app.listen(config.port, config.host, () => {
    logger.info(`Accounting backend listening on http://${config.host}:${config.port}`)
  })
}

start().catch((e) => {
  logger.error(e.message)
  process.exit(1)
})
