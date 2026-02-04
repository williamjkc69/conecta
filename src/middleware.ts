import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;

  // Define public paths that don't require authentication or verification
  const isPublicPath =
    path === "/" ||
    path.startsWith("/register") ||
    path.startsWith("/login") ||
    path.startsWith("/verify-email") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/update-password") ||
    path.startsWith("/auth") ||
    path.startsWith("/api/"); // Allow API routes to handle their own auth or be public

  // If public path, allow access
  if (isPublicPath) {
    return response;
  }

  // If no session, redirect to login (home)
  if (!session) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("login", "true");
    return NextResponse.redirect(redirectUrl);
  }

  // Check verification status from database
  let isVerified = false;

  if (session) {
    // Check if user has verified_at timestamp in public.users table
    const { data: userData } = await supabase
      .from("users")
      .select("verified_at")
      .eq("auth_user_id", session.user.id)
      .single();

    isVerified = !!userData?.verified_at;
  }

  if (!isVerified) {
    // If not verified, redirect to verify-email page
    // Avoid redirect loop if already there
    if (!path.startsWith("/verify-email")) {
      return NextResponse.redirect(new URL("/verify-email", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
