import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Next.js 16 deprecated the "middleware" file convention in favor of "proxy".
// This file (src/proxy.ts) replaces the old src/middleware.ts.
// The function name 'proxy' is the new convention (still accepts 'middleware'
// for backward compat, but 'proxy' is preferred for new code).

export async function proxy(req: NextRequest) {
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
