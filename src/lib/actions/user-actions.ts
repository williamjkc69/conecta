"use server";

import { createClient } from "@supabase/supabase-js";
import { verifyUserSession } from "@/lib/server-auth";

/**
 * Server Action to delete a user securely.
 * Checks for admin privileges.
 */
export async function deleteUserAction(authId: string) {
  try {
    // 1. Verify Authentication
    const session = await verifyUserSession();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    // 2. Initialise Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 3. Verify Admin Role
    const { data: userData, error: roleError } = await supabaseAdmin
      .from("users")
      .select("role:roles(name)")
      .eq("auth_user_id", session.user.id)
      .single();

    if (roleError || !userData) {
      throw new Error("Failed to verify user role");
    }

    const roleName = Array.isArray(userData.role)
      ? userData.role[0]?.name
      : (userData.role as any)?.name;

    if (roleName !== "admin") {
      throw new Error("Forbidden: Only administrators can delete users");
    }

    // 4. Validate Input
    if (!authId) {
      throw new Error("User ID is required");
    }

    if (authId === session.user.id) {
      throw new Error("You cannot delete your own account");
    }

    // 5. Perform Deletion
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(authId);

    if (deleteError) {
      console.error("Supabase Auth delete error:", deleteError);
      throw new Error(deleteError.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteUserAction:", error);
    return { success: false, error: error.message };
  }
}
