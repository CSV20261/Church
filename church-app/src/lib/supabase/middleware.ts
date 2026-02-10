import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // Wrap in try-catch to handle invalid refresh tokens
  try {
    const { error } = await supabase.auth.getUser();
    
    // If there's an auth error (invalid token), clear the session
    if (error) {
      // Clear auth cookies by setting them to expire
      const authCookies = request.cookies.getAll().filter(
        cookie => cookie.name.includes('auth') || cookie.name.includes('supabase')
      );
      
      authCookies.forEach(cookie => {
        supabaseResponse.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
        });
      });

      // Redirect to login if accessing protected routes
      const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                               request.nextUrl.pathname.startsWith('/onboarding') ||
                               request.nextUrl.pathname.startsWith('/pending-approval');
      
      if (isProtectedRoute) {
        const loginUrl = new URL('/auth/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  } catch (error) {
    console.error('Middleware auth error:', error);
    
    // Clear cookies on error
    const authCookies = request.cookies.getAll().filter(
      cookie => cookie.name.includes('auth') || cookie.name.includes('supabase')
    );
    
    authCookies.forEach(cookie => {
      supabaseResponse.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
      });
    });

    // Redirect to login for protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                             request.nextUrl.pathname.startsWith('/onboarding') ||
                             request.nextUrl.pathname.startsWith('/pending-approval');
    
    if (isProtectedRoute) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}
