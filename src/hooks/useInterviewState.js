import { useMemo, useCallback, useEffect } from 'react';
import { useApplicationRealtime } from '@/hooks/useApplicationRealtime';
import { useOpenAIRealtimeInterview } from '@/hooks/useOpenAIRealtimeInterview';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useInterviewState = ({ applicationId, user, onInterviewCompleted }) => {
  const { toast } = useToast();
  
  // 1. Manage Application State (Realtime)
  const { application, loading, error: appError } = useApplicationRealtime(applicationId);

  // 2. Manage Interview Call State
  const {
    callState,
    isAgentSpeaking,
    transcript,
    error: callError,
    startInterview: startSocket,
    stopInterview: stopSocket,
    isSaving,
    audioLevel
  } = useOpenAIRealtimeInterview({
    onInterviewEnd: async (data) => {
        if (onInterviewCompleted) onInterviewCompleted(data);
    },
    user,
    jobDetails: application?.jobs,
    application
  });

  // 3. Computed Properties
  const canInterview = useMemo(() => {
      if (!application) return false;
      
      const validStatuses = ['invited', 'in_progress'];
      const validCallStates = ['idle', 'error', 'ended'];
      
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

      if (application.interview_status === 'invited') {
          console.log(`[${new Date().toISOString()}] [useInterviewState] Updating status from 'invited' to 'in_progress'`);
          const { error } = await supabase.from('applications').update({ 
              interview_status: 'in_progress',
              status: 'interviewing'
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