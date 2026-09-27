// Utility to hash a password for use in the AUTH_PASSWORD_HASH env var.
// Run with: bun run scripts/hash-password.ts "your-password-here"
//
// Example output:
//   $2a$10$N9qO8U9i4XbVvRq/U3lZ.u8l3kB7vW2r4Yj1qWQ3aQKb5t1qYzZ.K
//
// Copy the entire output line and paste it as AUTH_PASSWORD_HASH in your .env file.

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

const hash = bcrypt.hashSync(password, 10)
// Escape $ as \$ so Next.js dotenv-expand doesn't try to substitute $2b / $10 / $4AD
const escapedHash = hash.replace(/\$/g, '\\$')
console.log('Add this to your .env file:')
console.log(`AUTH_USERNAME=admin`)
console.log(`AUTH_PASSWORD_HASH=${escapedHash}`)
console.log(`# (unescaped hash: ${hash})`)
