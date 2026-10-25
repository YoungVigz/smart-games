import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasRefreshToken = request.cookies.has('refresh_token');
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/dashboard', '/sudoku', '/statistics', '/profile'];
  const isProtectedPage = protectedPaths.some(path => pathname.startsWith(path));
  
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (hasRefreshToken && (isAuthPage || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!hasRefreshToken && isProtectedPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};