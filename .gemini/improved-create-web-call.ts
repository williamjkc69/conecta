import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors.ts";

const RETELL_API_KEY = Deno.env.get("RETELL_API_KEY");
const RETELL_AGENT_ID = Deno.env.get("RETELL_AGENT_ID");

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[create-web-call] Function invoked");

    // Validate environment variables
    if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
      console.error(
        "[create-web-call] Missing RETELL_API_KEY or RETELL_AGENT_ID"
      );
      throw new Error(
        "Retell API key or Agent ID is not set in environment variables."
      );
    }

    // Parse and validate request body
    const { metadata } = await req.json();

    // Basic validation
    if (!metadata?.userId || !metadata?.applicationId) {
      throw new Error(
        "Invalid metadata: userId and applicationId are required"
      );
    }

    console.log(
      "[create-web-call] Metadata received:",
      JSON.stringify(metadata)
    );

    const retellUrl = `https://api.retellai.com/v1/agents/${RETELL_AGENT_ID}/web-calls`;
    console.log(`[create-web-call] Retell API URL: ${retellUrl}`);

    // Call Retell API
    const response = await fetch(retellUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RETELL_API_KEY}`
      },
      body: JSON.stringify({ metadata })
    });

    console.log(
      `[create-web-call] Retell API response status: ${response.status}`
    );
    const responseText = await response.text();
    console.log(`[create-web-call] Retell API response body: ${responseText}`);

    // Handle non-OK responses
    if (!response.ok) {
      console.error("[create-web-call] Error from Retell:", responseText);

      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error("Invalid Retell API key");
      } else if (response.status === 404) {
        throw new Error("Retell agent not found");
      } else if (response.status === 429) {
        throw new Error("Retell API rate limit exceeded");
      }

      throw new Error(
        `Failed to create Retell web call: ${response.status} ${responseText}`
      );
    }

    // Parse response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error(
        "[create-web-call] Failed to parse Retell response as JSON:",
        parseErr
      );
      throw new Error("Retell API did not return valid JSON.");
    }

    // Extract access token (handle both field names)
    const access_token = data.accessToken || data.access_token;
    if (!access_token) {
      console.error(
        "[create-web-call] No access_token returned from Retell API. Full response:",
        data
      );
      throw new Error("No access_token returned from Retell API.");
    }

    console.log("[create-web-call] Returning access_token to client.");
    return new Response(JSON.stringify({ access_token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("[create-web-call] Exception:", error);

    // Return user-friendly error messages
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
};

serve(handler);
