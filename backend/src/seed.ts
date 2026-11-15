import { query } from './db'
import { hashPassword } from './auth'

async function main(): Promise<void> {
  // Usage: npm run seed -- <username> <password> [role]. No default password.
  const username = process.argv[2]
  const password = process.argv[3]
  const role = process.argv[4] || 'admin'
  if (!username || !password || password.length < 10) {
    console.error('Usage: tsx src/seed.ts <username> <password (10+ characters)> [admin|accountant|viewer]')
    process.exit(1)
  }
  const hash = await hashPassword(password)
  await query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role',
    [username, hash, role],
  )
  console.log(`User created: ${username} (${role})`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
