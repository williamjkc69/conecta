# Comprehensive Testing Guide: AI Interview Flow

This guide provides a step-by-step procedure to validate the complete lifecycle of the AI Interview system, ensuring strict adherence to the state machine: `pending` → `invited` → `in_progress` → `completed`.

## 1. Prerequisites
*   **Browser**: Chrome or Edge (recommended for best WebAudio support).
*   **Accounts**: 
    *   1 Admin/Company account (to send invites).
    *   1 Candidate account (to receive invites and interview).
*   **Hardware**: Working microphone.

---

## 2. Test Cases

### Test Case 1: New Candidate Application (Pending)
**Scenario**: A candidate applies for a job but has not yet been invited to interview.

1.  **Action**: Log in as a **Candidate**. Go to "Buscar Vacantes" and click "Aplicar" on a job.
2.  **Supabase Verification**: