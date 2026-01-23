/**
 * API Endpoints and URLs
 * Next.js compatible - uses process.env instead of import.meta.env
 */

// Retell API
export const RETELL_API = {
  BASE_URL: 'https://api.retellai.com/v2',
  ENDPOINTS: {
    CREATE_WEB_CALL: (agentId) => `/agents/${agentId}/web-calls`,
    GET_CALL: (callId) => `/calls/${callId}`,
    LIST_CALLS: '/calls',
  },
};

// OpenAI API
export const OPENAI_API = {
  REALTIME_URL: process.env.NEXT_PUBLIC_OPENAI_REALTIME_URL || 'wss://api.openai.com/v1/realtime',
  MODEL: process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL || 'gpt-4o-mini-realtime-preview-2024-12-17',
};
