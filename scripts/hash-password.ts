// Utility to hash a password for use in the AUTH_PASSWORD_HASH env var.
// Run with: bun run scripts/hash-password.ts "your-password-here"
//
// Output: a BASE64-encoded bcrypt hash (NOT a raw bcrypt hash).
// We use base64 because raw bcrypt hashes contain $ characters (e.g. $2b$10$...)
// which get corrupted by Next.js dotenv-expand in production. Base64 has no
// special characters, so it works in any env var UI (Vercel, .env files, etc.)
// without escaping issues.
//
// The auth code (src/lib/auth.ts) auto-detects: if the value starts with $2,
// it's treated as raw bcrypt; otherwise it's decoded as base64.
//
// Example output:
//   AUTH_USERNAME=admin
//   AUTH_PASSWORD_HASH=JDJiJDEwJDRBRC5BcjhoMUFVZVFJSnNCZ3FBV09DOWlhcUZBeXA4RG9qU0cuTUlabUthaXF2eEtRc1ky

import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error(
    'Usage: bun run scripts/hash-password.ts "your-password-here"'
  )
  process.exit(1)
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters long.')
  process.exit(1)
}

const rawHash = bcrypt.hashSync(password, 10)
// Encode as base64 (single line, no line wrapping)
const base64Hash = Buffer.from(rawHash, 'utf8').toString('base64')

console.log('Add this to your .env file (and to Vercel Environment Variables):')
console.log(`AUTH_USERNAME=admin`)
console.log(`AUTH_PASSWORD_HASH=${base64Hash}`)
console.log('')
console.log(`# (raw bcrypt hash for reference: ${rawHash})`)
console.log(`# Verify: bun run scripts/verify-password.ts "${password}"`)
