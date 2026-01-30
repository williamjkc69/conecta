import { NextRequest, NextResponse } from "next/server";

const RETELL_API_BASE_URL = "https://api.retellai.com/v2";
const RETELL_API_KEY = process.env.RETELL_API_KEY;

export async function POST(req: NextRequest) {
  try {
    console.log("[end-call] API route invoked");

    if (!RETELL_API_KEY) {
      console.error("[end-call] Missing RETELL_API_KEY");
      return NextResponse.json(
        { error: "Retell API key is not set" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { call_id } = body;

    if (!call_id) {
      return NextResponse.json(
        { error: "call_id is required" },
        { status: 400 }
      );
    }

    console.log(`[end-call] Ending call: ${call_id}`);

    // Call Retell API v2 to end the call
    const response = await fetch(`${RETELL_API_BASE_URL}/calls/${call_id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${RETELL_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[end-call] Error from Retell:", errorText);
      return NextResponse.json(
        { error: `Failed to end call: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    console.log("[end-call] Call ended successfully");

    return NextResponse.json({
      success: true,
      message: "Call ended successfully"
    });
  } catch (error) {
    console.error("[end-call] Exception:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
