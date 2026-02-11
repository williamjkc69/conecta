"use server";

import { sendEmail as sendEmailLib } from "@/lib/email";
import { EMAILS } from "@/constants/text";
import {
  verifyEmailTemplate,
  inviteNewUserTemplate,
  inviteExistingUserTemplate,
  resetPasswordTemplate,
  interviewCompletedTemplate,
  inviteAcceptedTemplate,
  decisionApprovedTemplate,
  decisionRejectedTemplate
} from "@/lib/email-templates";
import { verifyUserSession } from "@/lib/server-auth";
import { cookies } from "next/headers";

interface SendEmailPayload {
  to: string;
  type: string;
  payload: any;
}

export async function sendEmailAction({ to, type, payload }: SendEmailPayload) {
  try {
    console.log("[send-email] Server Action invoked");

    // Dual Auth Check: Allow if (Valid Token) OR (Valid User Session)
    // Server Actions are internal, so we mostly care about User Session.
    // However, if we want to allow unauthenticated calls (e.g. Forgot Password flow),
    // we need to be careful.
    // Forgot Password flow usually doesn't hit this API endpoint in the current code (it uses Supabase).
    // InviteCandidateModal DOES hit this endpoint and IS authenticated.

    // Let's check session.
    const session = await verifyUserSession();
    if (!session) {
      // If we are sending a VERIFICATION or RESET_PASSWORD email via this action,
      // we might need to allow unauthenticated access.
      // But looking at the usage in InviteCandidateModal, it sends INVITATION_EXISTING and INVITATION_NEW.
      // These should require authentication (Company User inviting Candidate).
      if (
        type === EMAILS.TYPES.VERIFICATION ||
        type === EMAILS.TYPES.RESET_PASSWORD
      ) {
        // Allow unauthenticated for these types?
        // Risky if not rate limited.
        // But currently ForgotPasswordPage uses Supabase SDK, not this.
        // VerifyEmailPage also seemingly uses Supabase SDK.
        // So this Action is likely only for Invite flow.
        // Safe to enforce auth for now.
        console.warn(
          "[send-email] Unauthenticated attempt to send email of type:",
          type
        );
        throw new Error("Unauthorized");
      }
      throw new Error("Unauthorized");
    }

    if (!to || !type) {
      throw new Error("Missing required fields");
    }

    let subject = "";
    let html = "";

    switch (type) {
      case EMAILS.TYPES.VERIFICATION:
        subject = EMAILS.SUBJECTS.VERIFICATION;
        html = verifyEmailTemplate(payload.link);
        break;
      case EMAILS.TYPES.INVITATION_NEW:
        subject = EMAILS.SUBJECTS.INVITATION_NEW;
        html = inviteNewUserTemplate(payload.link, payload.role);
        break;
      case EMAILS.TYPES.INVITATION_EXISTING:
        subject = EMAILS.SUBJECTS.INVITATION_EXISTING;
        html = inviteExistingUserTemplate(payload.link, payload.dashboardUrl);
        break;
      case EMAILS.TYPES.RESET_PASSWORD:
        subject = EMAILS.SUBJECTS.RESET_PASSWORD;
        html = resetPasswordTemplate(payload.link);
        break;
      case EMAILS.TYPES.INTERVIEW_COMPLETED:
        subject = EMAILS.SUBJECTS.INTERVIEW_COMPLETED;
        html = interviewCompletedTemplate(payload.candidateName, payload.date);
        break;
      case EMAILS.TYPES.INVITATION_ACCEPTED:
        subject = EMAILS.SUBJECTS.INVITATION_ACCEPTED;
        html = inviteAcceptedTemplate(
          payload.candidateEmail,
          payload.jobTitle,
          payload.companyName
        );
        break;
      case EMAILS.TYPES.DECISION_APPROVED:
        subject = EMAILS.SUBJECTS.DECISION_APPROVED.replace(
          "{jobTitle}",
          payload.jobTitle
        );
        html = decisionApprovedTemplate(
          payload.candidateName,
          payload.jobTitle
        );
        break;
      case EMAILS.TYPES.DECISION_REJECTED:
        subject = EMAILS.SUBJECTS.DECISION_REJECTED.replace(
          "{jobTitle}",
          payload.jobTitle
        );
        html = decisionRejectedTemplate(
          payload.candidateName,
          payload.jobTitle
        );
        break;
      default:
        throw new Error("Invalid email type");
    }

    const result = await sendEmailLib({ to, subject, html });

    if (result.success) {
      return { success: true, messageId: result.messageId };
    } else {
      throw new Error(`Failed to send email: ${result.error}`);
    }
  } catch (error) {
    console.error("[send-email] Exception:", error);
    throw error;
  }
}
