import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Ensures the request comes from an authenticated user session.
 * Returns the user object if authenticated, or null if not.
 */
export async function verifyUserSession(req?: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called on a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called on a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      }
    }
  );

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}

/**
 * Ensures the request has a valid API token in the headers.
 * Checks against the API_SECRET environment variable.
 * Supports 'x-api-secret' header or 'Authorization: Bearer <token>'
 */
export function verifyWebhookToken(req: NextRequest): boolean {
  const apiSecret = process.env.API_SECRET;

  if (!apiSecret) {
    console.warn(
      "API_SECRET is not set in environment variables. Webhook verification failed."
    );
    return false;
  }

  const secretHeader = req.headers.get("x-api-secret");
  const authHeader = req.headers.get("authorization");

  const isValid =
    (secretHeader && secretHeader === apiSecret) ||
    (authHeader && authHeader === `Bearer ${apiSecret}`);

  return !!isValid;
}

/**
 * Helper to generate a standardized unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
