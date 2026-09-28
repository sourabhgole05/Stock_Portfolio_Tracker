import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Single-user auth — credentials are stored in env vars.
// This keeps the app private: only the owner (with the username + password) can log in.

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Sign In',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'admin' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.warn('[auth] Missing username or password in request')
          return null
        }

        const expectedUser = process.env.AUTH_USERNAME
        const rawHash = process.env.AUTH_PASSWORD_HASH

        if (!expectedUser || !rawHash) {
          console.error(
            '[auth] AUTH_USERNAME or AUTH_PASSWORD_HASH is not set in env',
            'AUTH_USERNAME set:', !!expectedUser,
            'AUTH_PASSWORD_HASH set:', !!rawHash
          )
          return null
        }

        // The password hash can be stored in two formats:
        //   1. Base64-encoded (RECOMMENDED for Vercel — no $ chars, no escaping issues)
        //   2. Raw bcrypt hash starting with $2a$/$2b$/$2y$ (works locally but
        //      Next.js dotenv-expand corrupts $ chars in production)
        // We auto-detect: if the value starts with $2, it's raw; otherwise base64.
        let passwordHash = rawHash
        if (!rawHash.startsWith('$2')) {
          try {
            passwordHash = Buffer.from(rawHash, 'base64').toString('utf8')
            console.log('[auth] Decoded base64 password hash OK')
          } catch (e) {
            console.error('[auth] Failed to decode base64 hash:', e)
            return null
          }
        }

        // Username check (constant-time-ish: still compare even if user mismatched)
        const usernameMatch = credentials.username === expectedUser
        // Password check via bcrypt
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          passwordHash
        )

        if (usernameMatch && passwordMatch) {
          console.log('[auth] Successful login for user:', credentials.username)
          return {
            id: '1',
            name: credentials.username,
            email: `${credentials.username}@portfolio.local`,
          }
        }

        console.warn(
          '[auth] Login failed — username match:', usernameMatch,
          'password match:', passwordMatch,
          '(check AUTH_USERNAME and AUTH_PASSWORD_HASH values in Vercel env vars)'
        )

        // Small delay to slow brute force
        await new Promise((r) => setTimeout(r, 300))
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    // We render the login form inline on `/` — NextAuth still needs a signIn
    // page path for some flows; we redirect to "/" instead.
    signIn: '/',
    signOut: '/',
    error: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect back to "/" after sign-in
      return baseUrl
    },
  },
  // Use a strong secret from env
  secret: process.env.NEXTAUTH_SECRET,
  // Required for Vercel/production: lets NextAuth auto-detect the host URL
  // from the request headers (so it works across preview + production deployments
  // without needing to set NEXTAUTH_URL manually per deployment).
  // See: https://next-auth.js.org/configuration/options#trusthost
  trustHost: true,
}
