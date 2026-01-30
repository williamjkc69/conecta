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

    // Save to database using HYBRID APPROACH
    // - Core metrics in indexed columns for fast querying
    // - Detailed analysis in JSONB for flexibility
    // - No data duplication (references existing columns)
    const { error } = await supabase
      .from("applications")
      .update({
        // Existing metadata columns
        call_id: call.call_id,
        recording_url: call.recording_url,
        duration: Math.round((call.duration_ms || 0) / 60000),
        transcript: transcript,
        interview_status: "completed",
        status: "reviewed",

        // NEW: Hot fields for fast querying (indexed)
        interview_duration_minutes: Math.round((call.duration_ms || 0) / 60000),
        technical_competency_score:
          analysis.overall_assessment.technical_competency_score,
        interview_decision: analysis.recommendation.decision,
        interview_confidence: analysis.recommendation.confidence,

        // NEW: Detailed analysis in JSONB (no duplication of DB data)
        interview_analysis: {
          technical_skills_evaluation: analysis.technical_skills_evaluation,
          ...(analysis.custom_questions_evaluation && {
            custom_questions_evaluation: analysis.custom_questions_evaluation
          }),
          overall_assessment: {
            communication_quality:
              analysis.overall_assessment.communication_quality,
            language_proficiency:
              analysis.overall_assessment.language_proficiency,
            strengths: analysis.overall_assessment.strengths,
            weaknesses: analysis.overall_assessment.weaknesses,
            behavioral_observations:
              analysis.overall_assessment.behavioral_observations
          },
          recommendation: {
            reasoning: analysis.recommendation.reasoning,
            suggested_next_steps: analysis.recommendation.suggested_next_steps
          }
        },

        updated_at: new Date().toISOString()
      })
      .eq("id", applicationId);

    if (error) {
      console.error("[retell-webhook] DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
