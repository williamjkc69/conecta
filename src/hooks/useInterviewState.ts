// @ts-nocheck - Dependencies have @ts-ignore, suppressing cascading errors
import { useMemo, useCallback, useEffect } from "react";
// @ts-ignore
import { useApplicationRealtime } from "@/hooks/useApplicationRealtime";
// @ts-ignore
import { useOpenAIRealtimeInterview } from "@/hooks/useOpenAIRealtimeInterview";
// @ts-ignore
import { useRetellConnection } from "@/hooks/useRetellConnection";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { USE_RETELL } from "@/constants/retell";
import {
  INTERVIEW_STATUS,
  CANDIDATE_STATUS,
  CANDIDATE_STATUS_IDS
} from "@/constants/status";
import { CALL_STATES } from "@/constants/retell";
import { TABLES } from "@/constants/supabase";
import { HTTP_METHODS, HTTP_HEADERS } from "@/constants/common";

interface UseInterviewStateProps {
  applicationId: string;
  user: any;
  onInterviewCompleted?: (data: any) => void;
}

export const useInterviewState = ({
  applicationId,
  user,
  onInterviewCompleted
}: UseInterviewStateProps) => {
  const { toast } = useToast();

  // 1. Manage Application State (Realtime)
  const {
    application,
    loading,
    error: appError
  } = useApplicationRealtime(applicationId);

  // 2. Manage Interview Call State

  // OpenAI integration (default)
  const openaiHook = useOpenAIRealtimeInterview({
    onInterviewEnd: async (data: any) => {
      if (onInterviewCompleted) onInterviewCompleted(data);
    },
    user,
    jobDetails: (application as any)?.jobs,
    application
  });

  // Retell integration (opt-in via env)
  const retellHook = useRetellConnection({
    onInterviewCompleted: async (data: any) => {
      if (onInterviewCompleted) onInterviewCompleted(data);
    },
    application,
    user,
    job: application?.jobs
  });

  const {
    callState,
    isAgentSpeaking,
    transcript,
    error: callError,
    startInterview: startSocket,
    stopInterview: stopSocket,
    isSaving,
    audioLevel,
    setSelectedMicId
  } = USE_RETELL ? retellHook : openaiHook;

  // 3. Computed Properties
  const canInterview = useMemo(() => {
    if (!application) return false;

    const validStatuses = [
      INTERVIEW_STATUS.INVITED,
      INTERVIEW_STATUS.IN_PROGRESS
    ];
    const validCallStates = [
      CALL_STATES.IDLE,
      CALL_STATES.ERROR,
      CALL_STATES.ENDED
    ];

    const isStatusValid = validStatuses.includes(application.interview_status);
    const isCallStateValid = validCallStates.includes(callState);

    return isStatusValid && isCallStateValid;
  }, [application, callState]);

  // 5) Add logging for state changes.
  useEffect(() => {
    if (application) {
      console.log(
        `[${new Date().toISOString()}] [useInterviewState] State Update:`
      );
      console.log(`   - Interview Status: ${application.interview_status}`);
      console.log(`   - Call State: ${callState}`);
      console.log(`   - Can Interview: ${canInterview}`);
    }
  }, [application, callState, canInterview]);

  // 4. Wrapper Actions
  const startInterview = useCallback(
    async (deviceId?: string) => {
      if (!application) return;

      console.log(
        `[${new Date().toISOString()}] [useInterviewState] Attempting to start interview...`
      );

      if (application.interview_status === INTERVIEW_STATUS.INVITED) {
        console.log(
          `[${new Date().toISOString()}] [useInterviewState] Updating status from 'invited' to 'in_progress'`
        );

        // Use API to update status (id 6) -> More reliable than client side RLS
        console.log(
          `[useInterviewState] Calling API to set status ${CANDIDATE_STATUS_IDS.INTERVIEWING} (interviewing)`
        );

        try {
          const response = await fetch("/api/set-application-status", {
            method: HTTP_METHODS.POST,
            headers: { "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON },
            body: JSON.stringify({
              applicationId: application.id,
              status: CANDIDATE_STATUS_IDS.INTERVIEWING
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to update status via API");
          }
        } catch (apiError: any) {
          console.error(
            "[useInterviewState] Status Update API failed:",
            apiError
          );
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "No se pudo actualizar el estado. Continuando de todos modos..."
          });
        }
      }

      await startSocket(deviceId);
    },
    [application, startSocket, toast]
  );

  return {
    application,
    loading,
    error: appError || callError,
    callState,
    isAgentSpeaking,
    transcript,
    startInterview,
    stopInterview: stopSocket,
    canInterview,
    isSaving,
    audioLevel,
    setSelectedMicId,
    interviewStatus: application?.interview_status
  };
};
