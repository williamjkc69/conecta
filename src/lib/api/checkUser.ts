"use server";

import { createClient } from "@supabase/supabase-js";
import { verifyUserSession } from "@/lib/server-auth";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || "");

export async function checkUser(email: string) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    if (!email) {
      throw new Error("Email is required");
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error checking user:", error);
      throw new Error(error.message);
    }

    return { exists: !!data };
  } catch (error) {
    console.error("Unexpected error:", error);
    throw error;
  }
}
