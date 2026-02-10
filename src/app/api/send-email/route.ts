import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, payload } = body;

    if (!to || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        );
    }

    const result = await sendEmail({ to, subject, html });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in send-email route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
