import { useMemo, useCallback, useEffect } from 'react';
import { useApplicationRealtime } from '@/hooks/useApplicationRealtime';
import { useOpenAIRealtimeInterview } from '@/hooks/useOpenAIRealtimeInterview';
import { useRetellConnection } from '@/hooks/useRetellConnection';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  USE_RETELL,
  INTERVIEW_STATUS,
  CALL_STATES,
  APPLICATION_STATUS,
  TABLES,
} from '@/constants';

export const useInterviewState = ({ applicationId, user, onInterviewCompleted }) => {
  const { toast } = useToast();
  
  // 1. Manage Application State (Realtime)
  const { application, loading, error: appError } = useApplicationRealtime(applicationId);

  // 2. Manage Interview Call State

  // OpenAI integration (default)
  const openaiHook = useOpenAIRealtimeInterview({
    onInterviewEnd: async (data) => {
      if (onInterviewCompleted) onInterviewCompleted(data);
    },
    user,
    jobDetails: application?.jobs,
    application
  });

  // Retell integration (opt-in via env)
  const retellHook = useRetellConnection({
    onInterviewCompleted: async (data) => {
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
    audioLevel
  } = USE_RETELL ? retellHook : openaiHook;

  // 3. Computed Properties
  const canInterview = useMemo(() => {
      if (!application) return false;
      
      const validStatuses = [INTERVIEW_STATUS.INVITED, INTERVIEW_STATUS.IN_PROGRESS];
      const validCallStates = [CALL_STATES.IDLE, CALL_STATES.ERROR, CALL_STATES.ENDED];
      
      const isStatusValid = validStatuses.includes(application.interview_status);
      const isCallStateValid = validCallStates.includes(callState);
      
      return isStatusValid && isCallStateValid;
  }, [application, callState]);

  // 5) Add logging for state changes.
  useEffect(() => {
      if (application) {
          console.log(`[${new Date().toISOString()}] [useInterviewState] State Update:`);
          console.log(`   - Interview Status: ${application.interview_status}`);
          console.log(`   - Call State: ${callState}`);
          console.log(`   - Can Interview: ${canInterview}`);
      }
  }, [application, callState, canInterview]);

  // 4. Wrapper Actions
  const startInterview = useCallback(async () => {
      if (!application) return;
      
      console.log(`[${new Date().toISOString()}] [useInterviewState] Attempting to start interview...`);

      if (application.interview_status === INTERVIEW_STATUS.INVITED) {
          console.log(`[${new Date().toISOString()}] [useInterviewState] Updating status from 'invited' to 'in_progress'`);
          const { error } = await supabase.from(TABLES.APPLICATIONS).update({ 
              interview_status: INTERVIEW_STATUS.IN_PROGRESS,
              status: APPLICATION_STATUS.INTERVIEWING
          }).eq('id', application.id);

          if (error) {
              console.error(`[${new Date().toISOString()}] [useInterviewState] Error updating status:`, error);
              toast({ variant: "destructive", title: "Error", description: "No se pudo iniciar la entrevista." });
              return;
          }
      }

      await startSocket();
  }, [application, startSocket, toast]);

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
    interviewStatus: application?.interview_status
  };
};