import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import {
  RETELL_API_BASE_URL,
  RETELL_ENDPOINTS,
  HEADERS,
  ERROR_MESSAGES,
  HTTP_STATUS
} from "./constants.ts";

const RETELL_API_KEY = Deno.env.get("RETELL_API_KEY");
const RETELL_AGENT_ID = Deno.env.get("RETELL_AGENT_ID");

interface Metadata {
  userId?: string;
  applicationId?: string;
  candidateName?: string;
  jobTitle?: string;
  jobRequirements?: string[];
}

interface RetellWebCallResponse {
  access_token?: string;
  accessToken?: string;
  call_id: string;
  call_type: string;
  call_status: string;
  agent_id: string;
}

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
      throw new Error(ERROR_MESSAGES.MISSING_ENV_VARS);
    }

    // Parse and validate request body
    const { metadata } = (await req.json()) as { metadata: Metadata };

    // Validate required metadata fields
    if (!metadata?.userId || !metadata?.applicationId) {
      console.error("[create-web-call] Invalid metadata:", metadata);
      throw new Error(ERROR_MESSAGES.INVALID_METADATA);
    }

    console.log(
      "[create-web-call] Metadata received:",
      JSON.stringify(metadata)
    );

    // Build Retell API v2 URL
    const retellUrl = `${RETELL_API_BASE_URL}${RETELL_ENDPOINTS.CREATE_WEB_CALL(RETELL_AGENT_ID)}`;
    console.log(`[create-web-call] Retell API v2 URL: ${retellUrl}`);

    // Call Retell API v2
    const response = await fetch(retellUrl, {
      method: "POST",
      headers: {
        "Content-Type": HEADERS.CONTENT_TYPE,
        Authorization: HEADERS.AUTHORIZATION(RETELL_API_KEY)
      },
      body: JSON.stringify({ metadata })
    });

    console.log(
      `[create-web-call] Retell API response status: ${response.status}`
    );
    const responseText = await response.text();
    console.log(`[create-web-call] Retell API response body: ${responseText}`);

    // Handle specific error status codes
    if (!response.ok) {
      console.error("[create-web-call] Error from Retell:", responseText);

      let errorMessage: string;
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          errorMessage = ERROR_MESSAGES.INVALID_API_KEY;
          break;
        case HTTP_STATUS.NOT_FOUND:
          errorMessage = ERROR_MESSAGES.AGENT_NOT_FOUND;
          break;
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          errorMessage = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
          break;
        default:
          errorMessage = `Failed to create Retell web call: ${response.status} ${responseText}`;
      }

      throw new Error(errorMessage);
    }

    // Parse JSON response
    let data: RetellWebCallResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error(
        "[create-web-call] Failed to parse Retell response as JSON:",
        parseErr
      );
      throw new Error(ERROR_MESSAGES.INVALID_JSON);
    }

    // Extract access token (handle both field names for compatibility)
    const access_token = data.access_token || data.accessToken;
    if (!access_token) {
      console.error(
        "[create-web-call] No access_token in response. Full response:",
        data
      );
      throw new Error(ERROR_MESSAGES.NO_ACCESS_TOKEN);
    }

    console.log("[create-web-call] Successfully created web call");
    console.log(`[create-web-call] Call ID: ${data.call_id}`);
    console.log(`[create-web-call] Call Status: ${data.call_status}`);

    // Return access token to client
    return new Response(
      JSON.stringify({
        access_token,
        call_id: data.call_id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": HEADERS.CONTENT_TYPE },
        status: HTTP_STATUS.OK
      }
    );
  } catch (error) {
    console.error("[create-web-call] Exception:", error);

    const errorMessage =
      error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": HEADERS.CONTENT_TYPE },
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR
    });
  }
};

serve(handler);
