"use server";

import { createClient } from "@supabase/supabase-js";
import { CANDIDATE_STATUS, CANDIDATE_STATUS_IDS } from "@/constants/status";
import { TABLES } from "@/constants/supabase";
import { sendEmail } from "@/lib/email";
import {
  inviteAcceptedTemplate,
  decisionApprovedTemplate
} from "@/lib/email-templates";
// Note: decisionApprovedTemplate imported but assumed unused or if needed.
// Just inviteAcceptedTemplate is used in code.
import { EMAILS } from "@/constants/text";
import { verifyUserSession } from "@/lib/server-auth";
import { cookies } from "next/headers";

interface AcceptInviteData {
  email: string;
  token: string;
  userId: string;
  jobId: string;
}

export async function acceptInvite({
  email,
  token,
  userId,
  jobId
}: AcceptInviteData) {
  try {
    // Verify session
    const session = await verifyUserSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    // Verify userId matches session user to prevent spoofing
    if (session.user.id !== userId) {
      throw new Error("Unauthorized: User ID mismatch");
    }

    if (!email || !token || !userId || !jobId) {
      throw new Error("Missing required fields");
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
      throw new Error("Invitation not found or invalid");
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
    const { error: appError } = await supabaseAdmin
      .from(TABLES.APPLICATIONS)
      .insert({
        user_id: userId,
        listing_id: jobId,
        status_id: CANDIDATE_STATUS_IDS.INVITED
      });

    if (appError) {
      throw appError;
    }

    // 4. Send notification to Company
    try {
      // Get Listing details
      const { data: listingData } = await supabaseAdmin
        .from("listings")
        .select("title")
        .eq("id", jobId)
        .single();

      // Get Company name
      const { data: companyData } = await supabaseAdmin
        .from("companies")
        .select("name")
        .eq("id", inviteData.company_id)
        .single();

      // Get Company email using admin client (assuming company_id maps to user ID, logic preserved from original)
      // Note: This logic seems risky if company_id != auth_user_id.
      const {
        data: { user: companyUser }
      } = await supabaseAdmin.auth.admin.getUserById(
        String(inviteData.company_id)
      );

      if (companyUser && companyUser.email) {
        try {
          const html = inviteAcceptedTemplate(
            email,
            listingData?.title || "una posición",
            companyData?.name || "su empresa"
          );

          await sendEmail({
            to: companyUser.email,
            subject: EMAILS.SUBJECTS.INVITATION_ACCEPTED,
            html
          });
        } catch (err) {
          console.error("Internal email send failed:", err);
        }
      }
    } catch (notifyError) {
      console.error("Error sending notification to company:", notifyError);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    throw error;
  }
}
