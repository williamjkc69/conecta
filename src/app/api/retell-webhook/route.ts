import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { analyzeInterviewTranscript } from "@/lib/openai-interview-analyzer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[retell-webhook] Event:", body.event);

    // Only process call_ended events
    if (body.event !== "call_ended") {
      return NextResponse.json({ received: true });
    }

    const { call } = body;
    const metadata = call.metadata || call.retell_llm_dynamic_variables;
    const applicationId = metadata?.applicationId;

    if (!applicationId) {
      console.error("[retell-webhook] No applicationId in metadata");
      return NextResponse.json(
        { error: "Missing applicationId" },
        { status: 400 }
      );
    }

    // Extract transcript
    const transcript = call.transcript_object || call.transcript || [];

    // Generate AI-powered analysis of the interview
    console.log("[retell-webhook] Analyzing transcript with OpenAI...");
    const analysis = await analyzeInterviewTranscript(
      transcript,
      metadata.jobTitle || "Unknown Position",
      metadata.jobRequirements || "",
      metadata.language || "en",
      metadata.jobQuestions || "" // Pass custom questions
    );

    console.log("[retell-webhook] Analysis complete:", {
      decision: analysis.recommendation.decision,
      score: analysis.overall_assessment.technical_competency_score
    });

    // 1. Fetch Request Status ID for 'completed'
    // In a real scenario, cache this or use a constant if IDs are static.
    // For now, we query.
    const { data: statusData } = await supabase
      .from("application_statuses")
      .select("id")
      .eq("name", "completed")
      .single();

    const completedStatusId = statusData?.id;

    // 2. Update Application (Summary Data)
    const { error: appError } = await supabase
      .from("applications")
      .update({
        // Link fields
        status_id: completedStatusId,
        completed_at: new Date().toISOString(),

        // Call info
        call_id: call.call_id,
        recording_url: call.recording_url,
        interview_duration: Math.round((call.duration_ms || 0) / 60000), // minutes

        // High-level feedback
        interview_decision: analysis.recommendation.decision,
        feedback: analysis.recommendation.reasoning, // Short summary or reasoning

        updated_at: new Date().toISOString()
      })
      .eq("id", applicationId); // Postgres casts string "123" to int 123 if needed

    if (appError) {
      console.error("[retell-webhook] DB error (applications):", appError);
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    // 3. Insert/Upsert Detailed Report
    const reportData = {
      application_id: Number(applicationId), // Ensure number
      json_data: {
        transcript: transcript, // Store transcript here
        technical_competency_score:
          analysis.overall_assessment.technical_competency_score,
        interview_confidence: analysis.recommendation.confidence,
        formatted_analysis: {
          technical_skills_evaluation: analysis.technical_skills_evaluation,
          custom_questions_evaluation: analysis.custom_questions_evaluation,
          overall_assessment: analysis.overall_assessment,
          recommendation: analysis.recommendation
        }
      },
      created_at: new Date().toISOString()
    };

    const { error: reportError } = await supabase
      .from("reports")
      .upsert(reportData, { onConflict: "application_id" }); // overwrite if exists

    if (reportError) {
      console.error("[retell-webhook] DB error (reports):", reportError);
      // We don't fail the whole request if report fails, but we should log it.
      // Or maybe we should return error?
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    console.log(
      "[retell-webhook] Report saved for application:",
      applicationId
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[retell-webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
