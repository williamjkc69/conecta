import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    console.log("[interview-report] Received report from Retell");

    // Parse the incoming request
    const body = await request.json();
    console.log(
      "[interview-report] Request body:",
      JSON.stringify(body, null, 2)
    );

    // Extract the finalReport from the request
    // Retell sends function parameters in the body
    const { finalReport } = body;

    if (!finalReport) {
      console.error("[interview-report] No finalReport in request");
      return NextResponse.json(
        { error: "Missing finalReport parameter" },
        { status: 400 }
      );
    }

    // Extract metadata to identify the application
    const { interview_metadata } = finalReport;
    const applicationId = interview_metadata?.application_id;

    if (!applicationId) {
      console.error("[interview-report] No applicationId in report metadata");
      return NextResponse.json(
        { error: "Missing application_id in report" },
        { status: 400 }
      );
    }

    console.log(
      "[interview-report] Processing report for application:",
      applicationId
    );

    // Update the application with the interview report
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        interview_report: finalReport,
        interview_status: "completed",
        status: "reviewed",
        updated_at: new Date().toISOString()
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("[interview-report] Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save report", details: updateError.message },
        { status: 500 }
      );
    }

    console.log("[interview-report] Report saved successfully");

    // Return success response to Retell
    return NextResponse.json({
      success: true,
      message: "Report received and saved",
      application_id: applicationId
    });
  } catch (error: any) {
    console.error("[interview-report] Error processing report:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
