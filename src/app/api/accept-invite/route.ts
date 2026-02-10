import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { CANDIDATE_STATUS, CANDIDATE_STATUS_IDS } from "@/constants/status";
import { HTTP_METHODS, HTTP_HEADERS } from "@/constants/common";
import { TABLES } from "@/constants/supabase";

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
      .from(TABLES.INVITATIONS)
      .select("*")
      .eq("token", token)
      .eq("email", email)
      .eq("status", CANDIDATE_STATUS.PENDING)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: "Invitation not found or invalid" },
        { status: 404 }
      );
    }

    // 2. Update invitation status
    const { error: updateError } = await supabaseAdmin
      .from(TABLES.INVITATIONS)
      .update({ status: "accepted" })
      .eq("id", inviteData.id);

    if (updateError) {
      throw updateError;
    }

    // 3. Create Application
    // We use the ID constant directly below

    const { error: appError } = await supabaseAdmin
      .from(TABLES.APPLICATIONS)
      .insert({
        user_id: userId,
        listing_id: jobId, // In the request jobId is the listing_id
        status_id: CANDIDATE_STATUS_IDS.INVITED
      });

    if (appError) {
      throw appError;
    }

    // 4. Send notification to Company
    try {
      // Get Listing details to include in email
      const { data: listingData } = await supabaseAdmin
        .from("listings")
        .select("title")
        .eq("id", jobId)
        .single();

      // Get Company name from companies table
      const { data: companyData } = await supabaseAdmin
        .from("companies")
        .select("name")
        .eq("id", inviteData.company_id)
        .single();

      // Get Company email from auth.users using admin client
      const {
        data: { user: companyUser },
        error: userError
      } = await supabaseAdmin.auth.admin.getUserById(
        String(inviteData.company_id)
      );

      if (companyUser && companyUser.email) {
        // Send email
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: HTTP_METHODS.POST,
          headers: { "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON },
          body: JSON.stringify({
            type: "notification_invite_accepted",
            to: companyUser.email,
            payload: {
              candidateEmail: email,
              jobTitle: listingData?.title || "una posición",
              companyName: companyData?.name || "su empresa"
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
