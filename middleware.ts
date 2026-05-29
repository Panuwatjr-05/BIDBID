import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    // Admin routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Seller routes
    if (pathname.startsWith('/seller') && role !== 'SELLER') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Buyer routes
    if (pathname.startsWith('/buyer') && role !== 'BUYER') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/login',
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/seller/:path*',
    '/buyer/:path*',
    '/account/:path*',
  ],
}
