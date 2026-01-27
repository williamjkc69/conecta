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

    // 4. Send notification to Company
    try {
      // Get Job details to include in email
      const { data: jobData } = await supabaseAdmin
        .from("jobs")
        .select("title")
        .eq("id", jobId)
        .single();

      // Get Company email (from profiles or auth users - assuming profiles.email exists or similar)
      // Since invitations has company_id, we need to find who to notify.
      // For simplicity, we can notify the email associated with the company profile if available,
      // or we can skip strictly if we don't have a direct 'admin' email for the company easily accessible.
      // However, usually "profiles" table with role 'company' has the email.
      const { data: companyProfile } = await supabaseAdmin
        .from("profiles")
        .select("email, company_name") // Assuming 'email' column exists in profiles or we join auth.users
        .eq("id", inviteData.company_id)
        .single();

      // If we can't get email from profile directly (if it's in auth.users), we might need another approach.
      // But typically profiles has contact info. Let's assume we can fetch it.
      // Actually, standard Supabase pattern is to query auth.users via admin API,
      // OR if you sync email to public profile.

      // Let's try to get it from auth.users using admin client
      const {
        data: { user: companyUser },
        error: userError
      } = await supabaseAdmin.auth.admin.getUserById(inviteData.company_id);

      if (companyUser && companyUser.email) {
        // Send email
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "notification_invite_accepted",
            to: companyUser.email,
            payload: {
              candidateEmail: email,
              jobTitle: jobData?.title || "una posición",
              companyName:
                companyUser.user_metadata?.company_name || "su empresa"
            }
          })
        });
      }
    } catch (notifyError) {
      console.error("Error sending notification to company:", notifyError);
      // Don't fail the request if notification fails
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
