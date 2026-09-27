export { default } from 'next-auth/middleware'

// Protect everything except:
//  - NextAuth endpoints themselves: /api/auth/*
//  - Static assets: /_next/*, /favicon.ico, /logo.svg, /robots.txt
//  - The root page itself "/" — the root page renders a login form when
//     unauthenticated, so we must allow it through. The dashboard component
//     gates itself on the session.
//
// When an unauthenticated user hits a protected route (e.g. /api/dashboard),
// they get a 401 redirect to the sign-in page (root "/").

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth endpoints)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, logo.svg, robots.txt (public assets)
     * - / (the root page — shows login form when unauthenticated)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|logo.svg|robots.txt|$).*)',
  ],
}
