import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, token, userId, jobId } = await request.json();

    if (!email || !token || !userId || !jobId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify invitation
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("token", token)
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: "Invitation not found or invalid" },
        { status: 404 }
      );
    }

    // 2. Update invitation status
    const { error: updateError } = await supabaseAdmin
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", inviteData.id);

    if (updateError) {
      throw updateError;
    }

    // 3. Create Application
    const { error: appError } = await supabaseAdmin
      .from("applications")
      .insert({
        candidate_id: userId,
        job_id: jobId,
        company_id: inviteData.company_id,
        status: "invited",
        interview_status: "invited"
      });

    if (appError) {
      throw appError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
