import { useState, useRef, useEffect, useCallback } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";
import { supabase } from '@/lib/customSupabaseClient';
import {
  CALL_STATES,
  RETELL_EVENTS,
  AUDIO_CONFIG,
  TIMEOUTS,
  ERROR_MESSAGES,
  TABLES,
  SUPABASE_FUNCTIONS,
  APPLICATION_STATUS,
} from '@/constants';

// 👇 AGREGAMOS "job" AQUÍ
export const useRetellConnection = ({ onInterviewCompleted, application, user, job }) => {
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [transcript, setTranscript] = useState([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [error, setError] = useState(null);

  const retellClientRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const connectionTimeoutRef = useRef(null);

  const cleanup = useCallback(() => {
    console.log("Cleanup: Stopping call and media tracks.");
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);

    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
      retellClientRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const initializeAudioVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch (err) {
      console.error("Failed to get user media for visualizer:", err);
      setError(ERROR_MESSAGES.NO_MICROPHONE);
      setCallState(CALL_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    initializeAudioVisualizer();
    return () => {
      console.log("Component unmounting, performing final cleanup.");
      cleanup();
    };
  }, [initializeAudioVisualizer, cleanup]);


  const startInterview = async () => {
    if (callState !== CALL_STATES.IDLE && callState !== CALL_STATES.ERROR && callState !== CALL_STATES.ENDED) return;

    setCallState(CALL_STATES.CONNECTING);
    setError(null);
    setTranscript([]);

    try {
      console.log("[Retell] Updating application status to interviewing...");
      const { error: updateError } = await supabase
        .from(TABLES.APPLICATIONS)
        .update({ status: APPLICATION_STATUS.INTERVIEWING })
        .eq('id', application.id);

      if (updateError) throw new Error(`[Retell] DB Error: ${updateError.message}`);

      console.log("[Retell] Initializing Retell client...");
      const client = new RetellWebClient();
      retellClientRef.current = client;

      client.on(RETELL_EVENTS.CONVERSATION_STARTED, () => {
        console.log("[Retell] Event: conversationStarted");
        clearTimeout(connectionTimeoutRef.current);
        setCallState(CALL_STATES.CONNECTED);
      });

      client.on(RETELL_EVENTS.CONVERSATION_ENDED, ({ code, reason, call }) => {
        console.log(`[Retell] Event: conversationEnded - Code: ${code}, Reason: ${reason}`);
        console.log("[Retell] Full call details:", call);
        setCallState(CALL_STATES.ENDED);
        stopInterview(true, call);
      });

      client.on(RETELL_EVENTS.ERROR, (error) => {
        console.error("[Retell] Retell Client Error:", error);
        setError(error.message || ERROR_MESSAGES.CALL_FAILED);
        setCallState(CALL_STATES.ERROR);
        cleanup();
      });

      client.on(RETELL_EVENTS.UPDATE, (update) => {
        if (update.transcript && update.transcript.length > 0) {
          setTranscript(prev => [...prev, ...update.transcript]);
        }
        setIsAgentSpeaking(update.turntaking === "agent");
      });

      console.log("[Retell] Requesting access token from Supabase function create-web-call...");

      // 👇 AQUI ENVIAMOS NOMBRE DEL CANDIDATO Y REQUISITOS
      const candidateName =
        user?.user_metadata?.full_name ||
        user?.email ||
        "Candidato";

      const jobTitle = job?.title || "";
      const jobRequirements = job?.requirements || [];

      const { data, error: funcError } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.CREATE_WEB_CALL, {
        body: {
          metadata: {
            userId: user?.id,
            applicationId: application?.id,
            candidateName,
            jobTitle,
            jobRequirements
          }
        }
      });

      console.log("[Retell] Supabase function response:", data);
      if (funcError) throw new Error(`[Retell] Supabase Error: ${funcError.message}`);
      if (data.error) throw new Error(`[Retell] Server Error: ${data.error}`);

      const { access_token } = data;
      if (!access_token) {
        console.error("[Retell] Did not receive access_token from server. Full response:", data);
        throw new Error(ERROR_MESSAGES.NO_ACCESS_TOKEN);
      }

      console.log("[Retell] Token received. Starting Retell call with access_token:", access_token);

      connectionTimeoutRef.current = setTimeout(() => {
        setError(ERROR_MESSAGES.CONNECTION_TIMEOUT);
        setCallState(CALL_STATES.ERROR);
        cleanup();
      }, TIMEOUTS.CONNECTION_TIMEOUT);

      await client.startCall({ accessToken: access_token });
      console.log("[Retell] startCall invoked.");

    } catch (err) {
      console.error("[Retell] Failed to start interview:", err);
      setError(err.message);
      setCallState(CALL_STATES.ERROR);
      cleanup();
    }
  };

  const stopInterview = useCallback(async (isAutoEnd = false, callDetails = null) => {
    console.log(`Stopping interview. Auto-end: ${isAutoEnd}`);
    if (!isAutoEnd && retellClientRef.current) {
      retellClientRef.current.stopCall();
    }

    if (application?.id && callDetails) {
      console.log("Saving full interview data to Supabase...");
      try {
        const updatePayload = {
          status: APPLICATION_STATUS.REVIEWED,
          call_id: callDetails.call_id,
          duration: callDetails.duration,
          recording_url: callDetails.recording_url,
          retell_llm_response_data: callDetails,
        };

        const { error: updateError } = await supabase
          .from(TABLES.APPLICATIONS)
          .update(updatePayload)
          .eq('id', application.id);

        if (updateError) throw updateError;
        console.log("Interview data saved successfully.");
      } catch (err) {
        console.error("Failed to save interview data:", err);
      }
    }

    cleanup();
    setCallState(CALL_STATES.ENDED);
    onInterviewCompleted({ transcript: callDetails?.transcript });
  }, [application, cleanup, onInterviewCompleted]);

  return {
    callState,
    transcript,
    isAgentSpeaking,
    analyser: analyserRef.current,
    error,
    startInterview,
    stopInterview,
  };
};