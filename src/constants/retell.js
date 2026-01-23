/**
 * Retell AI Configuration Constants
 * SDK Version: 2.x
 * Next.js compatible - uses process.env instead of import.meta.env
 */

// Retell Agent Configuration
export const RETELL_AGENT_ID = process.env.NEXT_PUBLIC_RETELL_AGENT_ID || '';

// Supabase Function URLs
export const RETELL_CREATE_WEB_CALL_URL = process.env.NEXT_PUBLIC_CREATE_WEB_CALL_URL || '';

// Feature Flags
export const USE_RETELL = 
  process.env.NEXT_PUBLIC_USE_RETELL === 'true' || 
  !!process.env.NEXT_PUBLIC_RETELL_AGENT_ID;

// Call States (Retell SDK v2)
export const CALL_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  ERROR: 'error',
};

// Retell API Call Status (from API response)
export const RETELL_CALL_STATUS = {
  REGISTERED: 'registered',
  NOT_CONNECTED: 'not_connected',
  ONGOING: 'ongoing',
  ENDED: 'ended',
  ERROR: 'error',
};

// Interview Status (Application DB)
export const INTERVIEW_STATUS = {
  INVITED: 'invited',
  IN_PROGRESS: 'in_progress',
  INTERVIEWING: 'interviewing',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
};

// Application Status (Application DB)
export const APPLICATION_STATUS = {
  APPLIED: 'applied',
  INVITED: 'invited',
  INTERVIEWING: 'interviewing',
  REVIEWED: 'reviewed',
  REJECTED: 'rejected',
};

// Retell Event Names (SDK v2)
export const RETELL_EVENTS = {
  CONVERSATION_STARTED: 'conversationStarted',
  CONVERSATION_ENDED: 'conversationEnded',
  UPDATE: 'update',
  ERROR: 'error',
  AGENT_START_TALKING: 'agent_start_talking',
  AGENT_STOP_TALKING: 'agent_stop_talking',
};

// Audio Configuration
export const AUDIO_CONFIG = {
  FFT_SIZE: 512,
  SAMPLE_RATE: 24000, // Retell uses 24kHz
};

// Timeouts
export const TIMEOUTS = {
  CONNECTION_TIMEOUT: 180000, // 3 minutes
  RETRY_DELAY: 1000, // 1 second
};

// Error Messages
export const ERROR_MESSAGES = {
  NO_MICROPHONE: 'No se pudo acceder al micrófono. Revisa los permisos.',
  CONNECTION_TIMEOUT: 'La conexión tardó demasiado. Inténtalo de nuevo.',
  NO_ACCESS_TOKEN: 'Did not receive access_token from server.',
  CALL_FAILED: 'Ocurrió un error en la llamada.',
  SAVE_FAILED: 'No se pudo guardar la entrevista.',
  START_FAILED: 'No se pudo iniciar la entrevista.',
};

// Turntaking States (Retell SDK v2)
export const TURNTAKING = {
  AGENT: 'agent',
  USER: 'user',
};
