import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Next.js 16 requires middleware to export an explicit function.
// Earlier versions allowed `export { default } from 'next-auth/middleware'`
// but Next.js 16 doesn't recognize that re-export pattern as a function export.
// So we write the auth check explicitly using `getToken` from next-auth/jwt.

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow NextAuth's own endpoints (sign-in, session, csrf, callbacks)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Check for a valid JWT in the request cookies
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // No token → redirect to login (root "/")
  if (!token) {
    const loginUrl = new URL('/', req.url)
    // For API requests, return 401 JSON instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated — proceed
  return NextResponse.next()
}

// Protect everything except:
//  - NextAuth endpoints: /api/auth/*
//  - Static assets: /_next/*, /favicon.ico, /logo.svg, /robots.txt
//  - The root page "/" — the root page renders a login form when
//     unauthenticated, so we must allow it through.
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|logo.svg|robots.txt|$).*)',
  ],
}
