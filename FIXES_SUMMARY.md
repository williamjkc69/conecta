# Fixes Summary: Critical Component Restoration

This document summarizes the immediate fixes applied to resolve the application crash and documents the current system architecture and flow.

## 1. Files Modified and Description of Changes

| File Path | Description of Changes |
| :--- | :--- |
| `src/components/ui/select.jsx` | **New File**: Created the missing Select component using `@radix-ui/react-select` primitives and TailwindCSS styling to match the shadcn/ui design system. This resolves the "Failed to load url" error. |
| `package.json` | **Dependency Update**: Added `@radix-ui/react-select` to dependencies to support the new Select component. |

---

## 2. Specific Bugs Fixed

| File Path | Bugs Fixed |
| :--- | :--- |
| `src/components/InviteCandidateModal.jsx` | **Crash on Load**: The component was importing `src/components/ui/select` which did not exist. Creating the file fixed the import error. |
| `package.json` | **Missing Dependency**: The project lacked the underlying Radix UI primitive for select menus. |

---

## 3. State Machine Documentation

The application follows a strict state machine for the interview process, managed via the `interview_status` field in the `applications` table.

**Flow:** `pending` → `invited` → `in_progress` → `completed`

| State | Trigger | Description |
| :--- | :--- | :--- |
| **pending** | Candidate applies to a job. | Initial state. Candidate waits for admin action. |
| **invited** | Admin uses `InviteCandidateModal`. | Admin assigns candidate to job. System updates status to `invited`. |
| **in_progress** | Candidate clicks "Start Interview". | Interview session is active. |
| **completed** | Interview finishes. | Transcript is saved, status updates to `completed`. |

---

## 4. UI & Button States

| State | UI Message | Button Visibility | Button Action |
| :--- | :--- | :--- | :--- |
| **pending** | "A la espera de invitación" | ❌ Hidden | None |
| **invited** | "Invitación Recibida" | ✅ Visible ("Realizar entrevista") | Navigates to `/interview/:id` |
| **in_progress** | "Entrevista en curso" | ✅ Visible ("Continuar entrevista") | Re-joins the active session |
| **completed** | "Proceso Finalizado" | ❌ Hidden | None (View summary if available) |

---

## 5. Hooks & Purpose

| Hook | Purpose |
| :--- | :--- |
| `useCandidateApplications` | Fetches applications for the logged-in candidate, including `interview_status`. |
| `useApplicationRealtime` | Subscribes to Supabase Realtime changes for `applications` table to update UI instantly when status changes (e.g., when invited). |
| `useInterviewState` | Manages the local state of the interview session (connected, speaking, error) and validates if `canInterview` is true. |
| `useOpenAIRealtimeInterview` | Handles the WebSocket connection to OpenAI/Retell for the voice interview logic. |
| `useAuth` | Manages user authentication session and profile data. |

---

## 6. Supabase Functions

| Function Name | Purpose |
| :--- | :--- |
| `assign_candidate_to_job` | **Critical**: Links a candidate to a job and sets `interview_status` to `'invited'`. Used by `InviteCandidateModal`. |
| `update_interview_status` | Updates the status (e.g., to `in_progress` or `completed`) and maps it to the legacy `status` field for backward compatibility. |
| `get_candidate_stats` | Retrieves candidate metrics for the admin dashboard. |
| `handle_new_user` | Trigger that automatically creates a `profile` entry when a new user signs up. |

---

## 7. Complete Flow: Candidate Postulation to Completion

1.  **Postulation**: Candidate applies (or is created by admin). `applications` row created with `interview_status: 'pending'`.
2.  **Invitation**:
    *   Admin opens `InviteCandidateModal`.
    *   Selects Candidate and Job.
    *   Calls `assign_candidate_to_job`.
    *   `interview_status` becomes `'invited'`.
3.  **Notification**: Candidate Dashboard updates via Realtime to show "Realizar entrevista" button.
4.  **Interview**:
    *   Candidate clicks button.
    *   Enters `InterviewPage`.
    *   System checks `canInterview` (must be `invited` or `in_progress`).
    *   Microphone permissions granted.
    *   Conversation with AI Agent occurs.
5.  **Completion**:
    *   Call ends (user hangs up or AI finishes).
    *   `update_interview_status` sets status to `'completed'`.
    *   Transcript saved to Supabase.
    *   Candidate redirected to Summary.

---

## 8. Before/After Comparison

**Component: `InviteCandidateModal.jsx`**

*   **Before**: Crashed application due to `Failed to load url .../ui/select`.
*   **After**: Loads correctly, allowing Admins to select Jobs/Candidates via a dropdown menu and invite them.

---

## 9. Console Logs Added

The following logs were verified in `InviteCandidateModal.jsx` to track the invitation flow:

*   `[InviteCandidateModal] Inviting {email} to job {title}`
*   `[InviteCandidateModal] Invitation successful: {data}`
*   `[InviteCandidateModal] Interview Status set to: invited`
*   `[InviteCandidateModal] Invitation failed: {error}`

---

## 10. Checklist of Fixes Implemented

- [x] Created `src/components/ui/select.jsx` with Radix UI primitives.
- [x] Added `@radix-ui/react-select` to `package.json`.
- [x] Verified `InviteCandidateModal` imports are now valid.
- [x] Documented system architecture and state flow.