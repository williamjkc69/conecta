# Documentation: AI Voice Interview Flow

## 1. Overview
This document outlines the complete technical implementation of the AI Voice Interview system, utilizing OpenAI's Realtime API, Supabase for backend services, and React for the frontend. The system enables automated, voice-based screening interviews with real-time transcription and state management.

## 2. Interview Lifecycle & State Machine

The interview process follows a strict state machine managed via the `applications` table in Supabase.

### States (`interview_status`)
1.  **`pending`**: Initial state when a candidate applies but hasn't been processed.
2.  **`invited`**: Admin/Company has explicitly invited the candidate to take the interview.
    *   *Trigger*: `InviteCandidateModal` or `assign_candidate_to_job` function.
    *   *UI*: "Realizar entrevista" button appears on Candidate Dashboard.
3.  **`applied`**: Candidate has accepted the invitation (optional intermediate state).
4.  **`in_progress`**: Candidate has connected to the interview session.
    *   *Trigger*: WebSocket connection established in `InterviewPage`.
    *   *UI*: "Entrevista en curso" indicator.
5.  **`completed`**: Interview finished successfully.
    *   *Trigger*: User clicks "Finalizar" or connection closes normally.
    *   *Action*: Transcript saved to DB.
    *   *UI*: "Entrevista completada" badge.

### Main Status Mapping (`status`)
The `interview_status` often maps to the main application `status` field:
*   `invited` -> `invited`
*   `in_progress` -> `interviewing`
*   `completed` -> `reviewed`

## 3. Architecture & Modified Files

### Core Logic
*   **`src/hooks/useOpenAIRealtimeInterview.js`**: The brain of the operation. Manages:
    *   WebSocket connection to OpenAI (`wss://api.openai.com/v1/realtime`).
    *   AudioContext setup (strictly 24,000Hz).
    *   Microphone stream handling via AudioWorklet.
    *   Incoming audio playback (PCM16).
    *   Real-time transcript generation.
    *   Error handling and resource cleanup.

*   **`src/hooks/useInterviewState.js`**: Orchestrator hook.
    *   Combines `useApplicationRealtime` (DB sync) and `useOpenAIRealtimeInterview` (Media).
    *   Computes derived state (e.g., `canInterview`).
    *   Handles optimistic UI updates.

*   **`src/hooks/useApplicationRealtime.js`**:
    *   Subscribes to Supabase Realtime changes for a specific application ID.
    *   Ensures UI reflects status changes immediately (e.g., if an admin cancels the invite while the user is on the page).

*   **`src/hooks/useCandidateApplications.js`**:
    *   Fetches and subscribes to the list of applications for the candidate dashboard.

### UI Components
*   **`src/pages/InterviewPage.jsx`**: The main interview interface.
    *   Includes `DebugPanel` for integration testing.
    *   Displays `AgentAvatar`, `Waveform`, and `InterviewControls`.
*   **`src/pages/CandidateDashboard.jsx`**: Lists applications with dynamic status badges and action buttons.
*   **`src/components/interview/InterviewControls.jsx`**: Buttons for Start/Stop with strict state validation.

### Backend (Supabase)
*   **`functions/create-openai-session`**: Edge Function.
    *   Securely fetches an ephemeral session token from OpenAI using the server-side API Key.
    *   Prevents exposing the OpenAI API Key to the client.

## 4. Audio Configuration (Critical)

The OpenAI Realtime API requires specific audio configurations. Mismatches will result in silence or noise.

*   **Sample Rate**: **24,000 Hz** (Fixed).
    *   *Implementation*: `new AudioContext({ sampleRate: 24000 })`.
    *   *Microphone*: `navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 24000, ... } })`.
*   **Format**: **PCM16** (16-bit Pulse Code Modulation).
    *   *Input*: Raw Int16 array buffer converted to Base64, sent via `input_audio_buffer.append`.
    *   *Output*: Base64 delta converted to Int16, then Float32 for playback.
*   **Echo Cancellation**: Enabled via `echoCancellation: true` in `getUserMedia`.
*   **Routing**: Microphone input is **NOT** connected to `destination` locally to prevent immediate echo. It is sent only to the WebSocket.

## 5. Supabase Functions & Database

### Tables
*   **`applications`**:
    *   `id` (uuid): Primary Key.
    *   `interview_status` (text): Tracks the specific interview lifecycle.
    *   `status` (text): General application status.
    *   `transcript` (jsonb): Stores the conversation log upon completion.

### Functions
*   **`create-openai-session` (Edge Function)**:
    *   *Input*: `{ applicationId: string }`
    *   *Output*: `{ client_secret: { value: string } }`
*   **`assign_candidate_to_job` (DB RPC)**:
    *   Assigns a candidate and sets `interview_status = 'invited'`.

## 6. Error Handling & Recovery

1.  **Connection Timeout**: If the WebSocket doesn't connect within 10 seconds, the state resets to `error`, allowing a retry.
2.  **Microphone Access**: Specific handling for `NotAllowedError` and `NotFoundError` with user-friendly messages.
3.  **Session Creation**: If the Edge Function fails (e.g., invalid API key), the error is caught and displayed via Toast.
4.  **Data Saving**: If saving the transcript to Supabase fails, a local backup is attempted in `localStorage`, and the user is notified.
5.  **Cleanup**: A centralized `cleanup()` function ensures all tracks, contexts, and sockets are closed on unmount or error to prevent memory leaks.

## 7. Testing Instructions

### Prerequisites
*   A Supabase project with the schema applied.
*   `OPENAI_API_KEY` set in Supabase Secrets.
*   A microphone connected to your device.

### Step-by-Step Integration Test
1.  **Invite**: Log in as a Company/Admin. Go to a Job. Invite a candidate email.
    *   *Verify*: `interview_status` is `invited` in DB.
2.  **Dashboard**: Log in as the Candidate.
    *   *Verify*: The job appears with a "Realizar entrevista" button.
3.  **Setup**: Click "Realizar entrevista".
    *   *Verify*: You are taken to `/interview/:id`. The Debug Panel shows "Status: Invited".
4.  **Start**: Click "Iniciar Entrevista".
    *   *Verify*: Browser asks for Mic permission. Status changes to "Connecting" -> "Connected".
5.  **Speak**: Say "Hola".
    *   *Verify*: The "Audio Detected" check in Debug Panel turns green. The AI responds.
6.  **Transcript**: Watch the transcript update in real-time.
7.  **End**: Click "Finalizar".
    *   *Verify*: Status changes to "Ended". A toast confirms "Entrevista guardada".
8.  **Review**: Go back to Dashboard.
    *   *Verify*: The button now says "Entrevista completada" (disabled) or "Ver resultados".

## 8. Troubleshooting Guide

| Issue | Probable Cause | Solution |
| :--- | :--- | :--- |
| **"Error de conexión" immediately** | Edge Function failure or missing API Key. | Check Supabase Edge Function logs. Verify `OPENAI_API_KEY`. |
| **Stuck on "Connecting..."** | WebSocket blocked or timeout. | Check browser console for WS errors. Verify firewall settings. |
| **AI doesn't respond (Silence)** | Audio Sample Rate mismatch. | Ensure your browser supports 24kHz. Check console for "AudioContext" logs. |
| **Echo / Feedback Loop** | Mic connected to Speaker locally. | Ensure `processor.connect(ctx.destination)` is commented out in `useOpenAIRealtimeInterview.js`. |
| **Button Disabled on Dashboard** | Wrong `interview_status`. | Check DB. Status must be `invited` or `in_progress`. |