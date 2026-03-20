"use server";

import { createClient } from "@supabase/supabase-js";
import { verifyUserSession } from "@/lib/server-auth";

/**
 * Server Action to toggle a user's disabled status.
 * Checks for admin privileges.
 */
export async function toggleUserStatusAction(userId: number, disable: boolean) {
  try {
    // 1. Verify Authentication
    const session = await verifyUserSession();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    // 2. Initialise Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      throw new Error("Server configuration error: Missing service role key");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate if Service Role Key works (Check admin access)
    const { error: adminCheckError } = await supabaseAdmin.auth.admin.listUsers(
      { page: 1, perPage: 1 }
    );
    if (adminCheckError) {
      console.error("Service Role Key validation failed:", adminCheckError);
      throw new Error(
        "Invalid SUPABASE_SERVICE_ROLE_KEY. It seems to lack admin privileges (is it the Anon Key?)."
      );
    }

    // 3. Verify Admin Role (Current User)
    const { data: userData, error: roleError } = await supabaseAdmin
      .from("users")
      .select("id, role:roles(name)")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    if (roleError) {
      console.error("Database error verifying role:", roleError);
      throw new Error(`Database error: ${roleError.message}`);
    }

    if (!userData) {
      console.error(
        "No user record found in public.users for auth_id:",
        session.user.id
      );
      throw new Error(
        "User record not found. Please ensure your account exists in the public.users table."
      );
    }

    const roleName = Array.isArray(userData.role)
      ? userData.role[0]?.name
      : (userData.role as any)?.name;

    if (roleName !== "admin") {
      throw new Error("Forbidden: Only administrators can modify user status");
    }

    // 4. Validate Input
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Prevent disabling self
    // We check against the database ID we fetched earlier
    if (userId === userData.id) {
      throw new Error("You cannot disable your own account");
    }

    // 5. Perform Update
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ disabled: disable })
      .eq("id", userId); // Targeting by public.users.id (int)

    if (updateError) {
      console.error("Error updating user status:", updateError);
      throw new Error(updateError.message);
    }

    // Optionally: Update auth.users ban status for immediate effect?
    // Supabase Auth 'banned_until'
    /*
    if (disable) {
       // get auth_user_id from id?
       // extra query needed.
       // For now, rely on middleware check on 'disabled' column.
    }
    */

    return { success: true };
  } catch (error: any) {
    console.error("Error in toggleUserStatusAction:", error);
    return { success: false, error: error.message };
  }
}
