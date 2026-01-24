/**
 * Retell Web Call Service
 * Centralized module for managing Retell AI web calls
 */

export interface RetellCallMetadata {
  userId: string;
  applicationId: string;
  candidateName?: string;
  jobTitle?: string;
  jobRequirements?: string[];
}

export interface RetellCallResponse {
  access_token: string;
  call_id: string;
}

export interface RetellCallOptions {
  metadata: RetellCallMetadata;
  customData?: Record<string, any>;
}

/**
 * Create a new Retell web call
 */
export async function createWebCall(
  options: RetellCallOptions
): Promise<RetellCallResponse> {
  const response = await fetch("/api/create-web-call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      metadata: options.metadata,
      customData: options.customData
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create web call");
  }

  return response.json();
}

/**
 * End an active Retell call
 */
export async function endCall(callId: string): Promise<void> {
  const response = await fetch("/api/retell/end-call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ call_id: callId })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to end call");
  }
}

/**
 * Get call details from Retell API (server-side only)
 */
export async function getCallDetails(callId: string) {
  const RETELL_API_KEY = process.env.RETELL_API_KEY;

  if (!RETELL_API_KEY) {
    throw new Error("RETELL_API_KEY is not set");
  }

  const response = await fetch(`https://api.retellai.com/v2/calls/${callId}`, {
    headers: {
      Authorization: `Bearer ${RETELL_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get call details: ${response.status}`);
  }

  return response.json();
}

/**
 * Retell call event types
 */
export enum RetellEvent {
  CALL_STARTED = "call_started",
  CALL_ENDED = "call_ended",
  CALL_ANALYZED = "call_analyzed"
}

/**
 * Retell call states
 */
export enum RetellCallState {
  REGISTERED = "registered",
  ONGOING = "ongoing",
  ENDED = "ended",
  ERROR = "error"
}
