/**
 * Retell API Configuration Constants
 * For Supabase Edge Functions (Deno)
 */

// Retell API Base URL (v2)
export const RETELL_API_BASE_URL = "https://api.retellai.com/v2";

// Retell API Endpoints
export const RETELL_ENDPOINTS = {
  CREATE_WEB_CALL: (agentId: string) => `/agents/${agentId}/web-calls`,
  GET_CALL: (callId: string) => `/calls/${callId}`,
  LIST_CALLS: "/calls"
};

// HTTP Headers
export const HEADERS = {
  CONTENT_TYPE: "application/json",
  AUTHORIZATION: (apiKey: string) => `Bearer ${apiKey}`
};

// Error Messages
export const ERROR_MESSAGES = {
  MISSING_ENV_VARS:
    "Retell API key or Agent ID is not set in environment variables.",
  INVALID_METADATA: "Invalid metadata: userId and applicationId are required",
  INVALID_API_KEY: "Invalid Retell API key",
  AGENT_NOT_FOUND: "Retell agent not found",
  RATE_LIMIT_EXCEEDED: "Retell API rate limit exceeded",
  INVALID_JSON: "Retell API did not return valid JSON.",
  NO_ACCESS_TOKEN: "No access_token returned from Retell API.",
  UNKNOWN_ERROR: "Unknown error occurred"
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};
