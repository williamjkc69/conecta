# Interview State Flow Validation

This document outlines the strict state machine for the interview process, expected UI behaviors, and validation steps.

## 1. State Machine Overview

The `interview_status` field in the `applications` table drives the entire flow.

| State | Trigger | Description |
| :--- | :--- | :--- |
| **`pending`** | Candidate applies to a job. | Initial state. Waiting for admin/company review. |
| **`invited`** | Admin clicks "Invitar" or assigns candidate. | Candidate has been selected for an interview. |
| **`in_progress`** | Candidate clicks "Realizar Entrevista". | Interview session is active or has been started at least once. |
| **`completed`** | Candidate clicks "Finalizar" or session ends. | Interview is finished. Transcript saved. |

---

## 2. UI & Button Logic by State

### A. State: `pending`
*   **Context**: Candidate Dashboard.
*   **UI Display**: Card with "A la espera de invitación".
*   **Visual Indicator**: Clock icon / Grey badge.
*   **Buttons**: **NONE**. No action available.
*   **Message**: "Tu solicitud ha sido enviada. Si tu perfil coincide, recibirás una invitación."

### B. State: `invited`
*   **Context**: Candidate Dashboard.
*   **UI Display**: Highlighted Card (Blue/Cyan gradient).
*   **Visual Indicator**: Sparkles icon / "Acción Requerida" badge.
*   **Buttons**: **"Realizar entrevista"** (Enabled).
*   **Action**: Clicking navigates to `/interview/:id`.

### C. State: `in_progress`
*   **Context**: Candidate Dashboard & Interview Page.
*   **UI Display**:
    *   *Dashboard*: Card with "Entrevista en curso".
    *   *Interview Page*: Connection status, Waveform.
*   **Visual Indicator**: Loader/Spinner icon / Yellow badge.
*   **Buttons**:
    *   *Dashboard*: **"Continuar Entrevista"** (Enabled).
    *   *Interview Page*: **"Continuar Entrevista"** (if disconnected) or **"Finalizar"** (if connected).
*   **Logic**: Allows re-connection if the tab was closed accidentally.

### D. State: `completed`
*   **Context**: Candidate Dashboard & Interview Page.
*   **UI Display**:
    *   *Dashboard*: Card with "Proceso Finalizado".
    *   *Interview Page*: Summary view or "Entrevista Completada" message.
*   **Visual Indicator**: Check Circle icon / Green badge.
*   **Buttons**: **NONE** (or "Ver Resultados" if implemented). Start button is **DISABLED** or **HIDDEN**.
*   **Message**: "Has completado esta etapa del proceso."

---

## 3. Validation Checklist

1.  [ ] **New Application**: Apply as candidate -> Verify status is `pending` -> Verify NO button.
2.  [ ] **Invitation**: Admin invites candidate -> Verify status becomes `invited` -> Verify "Realizar entrevista" button appears.
3.  [ ] **Start**: Click "Realizar entrevista" -> Verify status becomes `in_progress` -> Verify redirection to Interview Page.
4.  [ ] **Re-entry**: Close tab during interview -> Return to Dashboard -> Verify "Continuar Entrevista" button.
5.  [ ] **Completion**: Finish interview -> Verify status becomes `completed` -> Verify "Proceso Finalizado" card on Dashboard.

## 4. Debugging

Console logs have been added to `CandidateDashboard`, `ApplicationCard`, and `InterviewPage` with the prefix `[StateValidation]`.

*   Look for: `[StateValidation] App ID: ..., Status: ..., Interview Status: ...`