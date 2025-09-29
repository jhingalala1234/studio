import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from './lib/auth';

export async function middleware(request: NextRequest) {
  const currentUser = await getCurrentUser();
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === '/'; // Our login page
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (isAuthRoute) {
    if (currentUser) {
      // If user is logged in and tries to access login page, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isDashboardRoute) {
    if (!currentUser) {
      // If user is not logged in and tries to access a dashboard route, redirect to login
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
