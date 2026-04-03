import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/', '/sign-in', '/sign-up', '/api/uploadthing']
const protectedRoutes = ['/dashboard', '/employee/dashboard']

const hasProtectedPrefix = (pathname: string) =>
  protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }

  if (!hasProtectedPrefix(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('mf_session')?.value
  if (!sessionCookie) {
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = '/sign-in'
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
