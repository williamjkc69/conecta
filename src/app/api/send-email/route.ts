import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import {
  verifyEmailTemplate,
  inviteNewUserTemplate,
  inviteExistingUserTemplate,
  resetPasswordTemplate,
  interviewCompletedTemplate
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
      case "verification":
        subject = "Verifica tu correo - Conecta";
        html = verifyEmailTemplate(payload.link);
        break;
      case "invitation_new":
        subject = "Invitación a unirse a Conecta";
        html = inviteNewUserTemplate(payload.link, payload.role);
        break;
      case "invitation_existing":
        subject = "Nueva invitación en Conecta";
        html = inviteExistingUserTemplate(payload.link, payload.dashboardUrl);
        break;
      case "reset_password":
        subject = "Restablecer contraseña";
        html = resetPasswordTemplate(payload.link);
        break;
      case "notification_completed":
        subject = "Entrevista Completada";
        html = interviewCompletedTemplate(payload.candidateName, payload.date);
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
