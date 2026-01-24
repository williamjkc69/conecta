import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface OpenAISessionResponse {
  id: string;
  model: string;
  client_secret: {
    value: string;
    expires_at: number;
  };
  expires_at: number;
}

export async function POST(req: NextRequest) {
  try {
    console.log("[create-openai-session] API route invoked");

    if (!OPENAI_API_KEY) {
      console.error("[create-openai-session] Missing OPENAI_API_KEY");
      return NextResponse.json(
        { error: "OpenAI API key is not set in environment variables." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[create-openai-session] Error from OpenAI:", errorText);
      return NextResponse.json(
        {
          error: `Failed to create OpenAI session: ${response.status} ${errorText}`
        },
        { status: response.status }
      );
    }

    const sessionData = (await response.json()) as OpenAISessionResponse;

    const { id, model, client_secret, expires_at } = sessionData;

    console.log("[create-openai-session] Successfully created session");
    console.log(`[create-openai-session] Session ID: ${id}`);

    // Return the specific structure as requested
    return NextResponse.json({
      id,
      model,
      client_secret,
      expires_at
    });
  } catch (error) {
    console.error("[create-openai-session] Exception:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
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
