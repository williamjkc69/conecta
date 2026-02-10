/**
 * API Endpoints and URLs
 * Next.js compatible - uses process.env instead of import.meta.env
 */

// Retell API
export const RETELL_API = {
  BASE_URL: "https://api.retellai.com/v2",
  ENDPOINTS: {
    CREATE_WEB_CALL: "/create-web-call",
    GET_CALL: (callId: string) => `/calls/${callId}`,
    LIST_CALLS: "/calls"
  }
} as const;

// OpenAI API
export const OPENAI_API = {
  SESSION_URL: "https://api.openai.com/v1/realtime/sessions",
  REALTIME_URL:
    process.env.NEXT_PUBLIC_OPENAI_REALTIME_URL ||
    "wss://api.openai.com/v1/realtime",
  MODEL:
    process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL ||
    "gpt-4o-mini-realtime-preview-2024-12-17"
} as const;
