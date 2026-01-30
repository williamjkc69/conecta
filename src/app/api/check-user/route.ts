import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Setup admin client to bypass RLS for existence check
// Note: In production, ensure these env vars are strictly server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Warning: Using anon key might fail if RLS policies are strict on 'profiles'.
// Ideally use SUPABASE_SERVICE_ROLE_KEY in .env.local
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = JSON object requested, multiple (or no) rows returned
      console.error("Error checking user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If data exists, user exists
    return NextResponse.json({ exists: !!data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
