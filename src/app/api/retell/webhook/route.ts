import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { INTERVIEW_STATUS, CANDIDATE_STATUS } from "@/constants/status";

export async function POST(req: NextRequest) {
  try {
    console.log("[retell-webhook] Webhook received");

    const body = await req.json();
    const { event, call } = body;

    console.log(`[retell-webhook] Event: ${event}`);
    console.log(`[retell-webhook] Call ID: ${call?.call_id}`);

    // Handle different event types
    switch (event) {
      case "call_started":
        console.log("[retell-webhook] Call started");
        await handleCallStarted(call);
        break;

      case "call_ended":
        console.log("[retell-webhook] Call ended");
        await handleCallEnded(call);
        break;

      case "call_analyzed":
        console.log("[retell-webhook] Call analyzed");
        await handleCallAnalyzed(call);
        break;

      default:
        console.log(`[retell-webhook] Unhandled event type: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[retell-webhook] Exception:", error);

    // Still return 200 to prevent Retell from retrying
    return NextResponse.json({
      received: true,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

async function handleCallStarted(call: any) {
  const { call_id, metadata } = call;

  if (metadata?.applicationId) {
    await supabase
      .from("applications")
      .update({
        interview_status: INTERVIEW_STATUS.IN_PROGRESS,
        status: CANDIDATE_STATUS.INTERVIEWING,
        retell_call_id: call_id
      })
      .eq("id", metadata.applicationId);
  }
}

async function handleCallEnded(call: any) {
  const { call_id, metadata, end_timestamp, call_analysis } = call;

  console.log("[retell-webhook] Call ended details:", {
    call_id,
    end_timestamp,
    metadata
  });

  if (metadata?.applicationId) {
    const updateData: any = {
      interview_status: INTERVIEW_STATUS.COMPLETED,
      status: CANDIDATE_STATUS.REVIEWED,
      retell_call_ended_at: end_timestamp
    };

    // Add call analysis if available
    if (call_analysis) {
      updateData.call_analysis = call_analysis;
    }

    await supabase
      .from("applications")
      .update(updateData)
      .eq("id", metadata.applicationId);

    console.log(
      `[retell-webhook] Updated application ${metadata.applicationId}`
    );
  }
}

async function handleCallAnalyzed(call: any) {
  const { call_id, metadata, call_analysis } = call;

  if (metadata?.applicationId && call_analysis) {
    await supabase
      .from("applications")
      .update({
        call_analysis: call_analysis,
        transcript: call_analysis.transcript || null
      })
      .eq("id", metadata.applicationId);

    console.log(
      `[retell-webhook] Saved call analysis for ${metadata.applicationId}`
    );
  }
}

// Allow POST without authentication (Retell will send events)
export const runtime = "nodejs";
