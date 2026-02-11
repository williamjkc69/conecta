import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeInterviewTranscript } from "@/lib/openai-interview-analyzer";
import { CANDIDATE_STATUS, CANDIDATE_STATUS_IDS } from "@/constants/status";
import { verifyWebhookToken, unauthorizedResponse } from "@/lib/server-auth";

export async function processRetellWebhook(request: NextRequest) {
  try {
    // Verify Webhook Token - moved from route file
    if (!verifyWebhookToken(request)) {
      return unauthorizedResponse("Invalid Webhook Token");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    console.log("applicationId", applicationId);
    const { data: appData, error: appDatError } = await supabase
      .from("applications")
      .select("listing_id")
      .eq("id", applicationId)
      .single();

    if (appDatError || !appData) {
      console.error("Error fetching application listing_id:", appDatError);
      throw new Error("Application not found");
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
      decision: analysis.recommendation?.decision,
      score: analysis.overall_assessment?.technical_competency_score
    });

    const listingId = appData.listing_id;

    // 2. Fetch Listing Questions for matching
    const { data: listingQuestions } = await supabase
      .from("listing_questions")
      .select("id, question")
      .eq("listing_id", listingId);

    // 3. Store User Responses in interview_responses table
    if (
      analysis.custom_questions_evaluation &&
      Array.isArray(analysis.custom_questions_evaluation)
    ) {
      const responsesToInsert = analysis.custom_questions_evaluation.map(
        (evalItem: any) => {
          // Find matching question ID by loose text match
          const matchedQuestion = listingQuestions?.find(
            (q) =>
              q.question?.trim().toLowerCase() ===
                evalItem.question?.trim().toLowerCase() ||
              evalItem.question
                ?.toLowerCase()
                .includes(q.question?.toLowerCase())
          );

          return {
            application_id: Number(applicationId),
            question_id: matchedQuestion?.id || null,
            question_text: evalItem.question,
            response: evalItem.answer_summary || "No answer provided",
            quality: evalItem.quality
            // score: ? // LLM didn't return score per question in schema
          };
        }
      );
      console.log("responsesToInsert", responsesToInsert);

      if (responsesToInsert.length > 0) {
        const { error: respError } = await supabase
          .from("interview_responses")
          .insert(responsesToInsert);

        if (respError) console.error("Error inserting responses:", respError);
        else
          console.log(
            `Inserted ${responsesToInsert.length} interview responses.`
          );
      }
    }

    // 4. Fetch Status ID for 'completed'
    const { data: statusData } = await supabase
      .from("application_statuses")
      .select("id")
      .eq("name", CANDIDATE_STATUS.COMPLETED)
      .single();

    const completedStatusId = statusData?.id || CANDIDATE_STATUS_IDS.COMPLETED;

    // 5. Update Application with Score and Decision
    const techScore = analysis.overall_assessment?.technical_competency_score;
    const applicationData = {
      status_id: completedStatusId,
      completed_at: new Date().toISOString(),

      call_id: call.call_id,
      recording_url: call.recording_url,
      interview_duration: Math.round((call.duration_ms || 0) / 1000), // seconds

      // New fields
      technical_competency_score:
        typeof techScore === "number" ? Math.round(techScore) : null,
      interview_decision: analysis.recommendation?.decision,
      feedback: analysis.recommendation?.reasoning,

      updated_at: new Date().toISOString()
    };
    console.log("applicationData", applicationData);
    const { error: appError } = await supabase
      .from("applications")
      .update(applicationData)
      .eq("id", applicationId);

    if (appError) {
      console.error("[retell-webhook] DB error (applications):", appError);
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    // 6. Store Remaining Analysis in Reports (json_data)
    const reportJsonData = {
      transcript: transcript, // Keep backup
      overall_assessment: analysis.overall_assessment,
      recommendation: analysis.recommendation,
      // We can include full analysis too just in case
      full_analysis_dump: analysis
    };

    const reportData = {
      application_id: Number(applicationId),
      json_data: reportJsonData,
      created_at: new Date().toISOString()
    };
    console.log("reportData", reportData);
    const { error: reportError } = await supabase
      .from("reports")
      .upsert(reportData, { onConflict: "application_id" });

    if (reportError) {
      console.error("[retell-webhook] DB error (reports):", reportError);
      // Log error but success true as app update succeeded
    } else {
      console.log("[retell-webhook] Report saved successfully.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[retell-webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
