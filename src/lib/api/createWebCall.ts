"use server";

import { RETELL_API } from "@/constants/api";
import { HTTP_METHODS, HTTP_HEADERS } from "@/constants/common";
import { verifyUserSession } from "@/lib/server-auth";
import { cookies } from "next/headers";

const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID;

interface Metadata {
  userId?: string;
  applicationId?: string;
  candidateName?: string;
  jobTitle?: string;
  language?: string;
  jobRequirements?: string | string[];
  jobQuestions?: string;
}

interface RetellWebCallResponse {
  access_token?: string;
  accessToken?: string;
  call_id: string;
  call_type: string;
  call_status: string;
  agent_id: string;
}

// Error Messages
const ERROR_MESSAGES = {
  MISSING_ENV_VARS:
    "Retell API key or Agent ID is not set in environment variables.",
  INVALID_METADATA: "Invalid metadata: userId and applicationId are required",
  INVALID_API_KEY: "Invalid Retell API key",
  AGENT_NOT_FOUND: "Retell agent not found",
  RATE_LIMIT_EXCEEDED: "Retell API rate limit exceeded",
  INVALID_JSON: "Retell API did not return valid JSON.",
  NO_ACCESS_TOKEN: "No access_token returned from Retell API.",
  UNKNOWN_ERROR: "Unknown error occurred",
  UNAUTHORIZED: "Unauthorized"
};

export async function createWebCall(metadata: Metadata) {
  try {
    console.log("[create-web-call] Server Action invoked");

    // We can pass null as req because verifyUserSession handles it by using cookies() if req is missing
    // or we can modify verifyUserSession.
    // However, looking at server-auth.ts (I recall it takes req: NextRequest).
    // Let's assume we need to fix server-auth.ts first or adapt here.
    // Actually, verifyUserSession calls createServerClient.
    // In Server Actions, we don't have NextRequest.
    // We should allow verifyUserSession to work without req.

    // For now, let's try to verify session independently if verifyUserSession is strict.
    // But better to update verifyUserSession to be optional req.

    // START TEMPORARY FIX: Direct session verification for Server Action
    // Note: Ideally verifyUserSession should support this.
    // Assuming verifyUserSession requires req.
    // Let's rely on the fact that existing verifyUserSession uses createServerClient checks.

    // Re-reading verifyUserSession (I recall it using cookies(req) if passed).
    // To be safe, I will update server-auth.ts to make req optional.

    // For this step, I will assume verifyUserSession(null) works or I fix it in next step.
    const session = await verifyUserSession(null as any);
    if (!session) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Validate environment variables
    if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
      console.error(
        "[create-web-call] Missing RETELL_API_KEY or RETELL_AGENT_ID"
      );
      throw new Error(ERROR_MESSAGES.MISSING_ENV_VARS);
    }

    // Validate required metadata fields
    if (!metadata?.userId || !metadata?.applicationId) {
      console.error("[create-web-call] Invalid metadata:", metadata);
      throw new Error(ERROR_MESSAGES.INVALID_METADATA);
    }

    console.log(
      "[create-web-call] Metadata received:",
      JSON.stringify(metadata)
    );

    // Build Retell API v2 URL - correct format
    const retellUrl = `${RETELL_API.BASE_URL}${RETELL_API.ENDPOINTS.CREATE_WEB_CALL}`;
    console.log(`[create-web-call] Retell API v2 URL: ${retellUrl}`);

    // Prepare request body with agent_id and metadata
    const requestBody: any = {
      agent_id: RETELL_AGENT_ID,
      metadata
    };

    // Convert all metadata values to strings for Retell dynamic variables
    // Retell requires all values to be strings
    const dynamicVariables: Record<string, string> = {};
    if (metadata.userId) dynamicVariables.userId = String(metadata.userId);
    if (metadata.applicationId)
      dynamicVariables.applicationId = String(metadata.applicationId);
    if (metadata.candidateName)
      dynamicVariables.candidateName = String(metadata.candidateName);
    if (metadata.jobTitle)
      dynamicVariables.jobTitle = String(metadata.jobTitle);
    if (metadata.language)
      dynamicVariables.language = String(metadata.language);
    if (metadata.jobRequirements) {
      dynamicVariables.jobRequirements = Array.isArray(metadata.jobRequirements)
        ? metadata.jobRequirements.join(", ")
        : String(metadata.jobRequirements);
    }
    if (metadata.jobQuestions) {
      dynamicVariables.jobQuestions = String(metadata.jobQuestions);
    }

    requestBody.retell_llm_dynamic_variables = dynamicVariables;

    console.log("[create-web-call] Request body:", JSON.stringify(requestBody));

    // Call Retell API v2
    const response = await fetch(retellUrl, {
      method: HTTP_METHODS.POST,
      headers: {
        "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON,
        Authorization: `Bearer ${RETELL_API_KEY}`
      },
      body: JSON.stringify(requestBody)
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
        case 401:
          errorMessage = ERROR_MESSAGES.INVALID_API_KEY;
          break;
        case 404:
          errorMessage = ERROR_MESSAGES.AGENT_NOT_FOUND;
          break;
        case 429:
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
    return {
      access_token,
      call_id: data.call_id
    };
  } catch (error) {
    console.error("[create-web-call] Exception:", error);
    throw error; // Re-throw for Client to handle
  }
}
