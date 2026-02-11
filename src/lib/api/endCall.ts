"use server";

import { verifyUserSession } from "@/lib/server-auth";
import { cookies } from "next/headers";

const RETELL_API_BASE_URL = "https://api.retellai.com/v2";
const RETELL_API_KEY = process.env.RETELL_API_KEY;

export async function endCall(call_id: string) {
  try {
    console.log("[end-call] Server Action invoked");

    const session = await verifyUserSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    if (!RETELL_API_KEY) {
      console.error("[end-call] Missing RETELL_API_KEY");
      throw new Error("Retell API key is not set");
    }

    if (!call_id) {
      throw new Error("call_id is required");
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
      throw new Error(`Failed to end call: ${response.status} ${errorText}`);
    }

    console.log("[end-call] Call ended successfully");

    return {
      success: true,
      message: "Call ended successfully"
    };
  } catch (error) {
    console.error("[end-call] Exception:", error);
    throw error;
  }
}
