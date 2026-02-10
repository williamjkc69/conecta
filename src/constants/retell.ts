import { INTERVIEW_STATUS, RETELL_CALL_STATUS } from "./status";

/**
 * Retell AI Configuration Constants
 * SDK Version: 2.x
 * Next.js compatible - uses process.env instead of import.meta.env
 */

// Retell Agent Configuration
export const RETELL_AGENT_ID = process.env.NEXT_PUBLIC_RETELL_AGENT_ID || "";

// Supabase Function URLs
export const RETELL_CREATE_WEB_CALL_URL =
  process.env.NEXT_PUBLIC_CREATE_WEB_CALL_URL || "";

// Feature Flags
export const USE_RETELL =
  process.env.NEXT_PUBLIC_USE_RETELL === "true" ||
  !!process.env.NEXT_PUBLIC_RETELL_AGENT_ID;

// Call States (Retell SDK v2)
export const CALL_STATES = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ENDED: "ended",
  ERROR: "error"
} as const;

// Re-export from status.ts for compatibility if needed, but preferred to import from status.ts directly
export { RETELL_CALL_STATUS, INTERVIEW_STATUS };

// Retell Event Names (SDK v2)
export const RETELL_EVENTS = {
  CALL_STARTED: "call_started",
  CALL_ENDED: "call_ended",
  UPDATE: "update",
  ERROR: "error",
  METADATA: "metadata",
  AUDIO: "audio",
  AGENT_START_TALKING: "agent_start_talking",
  AGENT_STOP_TALKING: "agent_stop_talking"
} as const;

// Audio Configuration
export const AUDIO_CONFIG = {
  FFT_SIZE: 512,
  SAMPLE_RATE: 24000 // Retell uses 24kHz
} as const;

// Timeouts
export const TIMEOUTS = {
  CONNECTION_TIMEOUT: 180000, // 3 minutes
  RETRY_DELAY: 1000 // 1 second
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NO_MICROPHONE: "No se pudo acceder al micrófono. Revisa los permisos.",
  CONNECTION_TIMEOUT: "La conexión tardó demasiado. Inténtalo de nuevo.",
  NO_ACCESS_TOKEN: "Did not receive access_token from server.",
  CALL_FAILED: "Ocurrió un error en la llamada.",
  SAVE_FAILED: "No se pudo guardar la entrevista.",
  START_FAILED: "No se pudo iniciar la entrevista."
} as const;

// Turntaking States (Retell SDK v2)
export const TURNTAKING = {
  AGENT: "agent",
  USER: "user"
} as const;
