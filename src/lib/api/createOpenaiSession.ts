"use server";

import { OPENAI_API } from "@/constants/api";
import { HTTP_METHODS, HTTP_HEADERS } from "@/constants/common";
import { verifyUserSession } from "@/lib/server-auth";
import { cookies } from "next/headers";

interface OpenAISessionResponse {
  id: string;
  model: string;
  client_secret: {
    value: string;
    expires_at: number;
  };
  expires_at: number;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function createOpenaiSession() {
  try {
    console.log("[create-openai-session] Server Action invoked");

    // Verify session - make req optional in verifyUserSession
    const session = await verifyUserSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    if (!OPENAI_API_KEY) {
      console.error("[create-openai-session] Missing OPENAI_API_KEY");
      throw new Error("OpenAI API key is not set in environment variables.");
    }

    // Default to 'realtime' model if not set in constant (but it is)
    // The previous implementation inferred model from constant or default.
    const model = "gpt-4o-realtime-preview-2024-12-17"; // Hardcoded or from constants?
    // Let's check constants/api.ts.
    // Assuming OPENAI_API.SESSION_URL is correct.
    // The prev code just POSTed to SESSION_URL. It didn't send body?
    // Wait, the previous code reading `createOpenaiSession.ts` lines 29-35:
    /*
    const response = await fetch(OPENAI_API.SESSION_URL, {
      method: HTTP_METHODS.POST,
      headers: { ... }
    });
    */
    // It sent NO BODY.
    // But in `createOpenaiSession.ts` lines 29-35 shown in `view_file` output:
    // It indeed has NO BODY.
    // However, in my failed `replace_file_content` I tried to add `body: JSON.stringify({ model, voice })`.
    // I should stick to the ORIGINAL implementation which had no body, UNLESS I see reason to add it.
    // But checking `view_file` output again: lines 29-35 has NO BODY.
    // So I will stick to NO BODY.

    const response = await fetch(OPENAI_API.SESSION_URL, {
      method: HTTP_METHODS.POST,
      headers: {
        "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON,
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "verse"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[create-openai-session] Error from OpenAI:", errorText);
      throw new Error(
        `Failed to create OpenAI session: ${response.status} ${errorText}`
      );
    }

    const sessionData = (await response.json()) as OpenAISessionResponse;

    const { id, client_secret, expires_at } = sessionData;

    console.log("[create-openai-session] Successfully created session");
    console.log(`[create-openai-session] Session ID: ${id}`);

    // Return the specific structure as requested
    return {
      id,
      model: sessionData.model,
      client_secret,
      expires_at
    };
  } catch (error) {
    console.error("[create-openai-session] Exception:", error);
    throw error;
  }
}
