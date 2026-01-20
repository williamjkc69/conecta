import { useState, useRef, useEffect, useCallback } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";
import { supabase } from '@/lib/customSupabaseClient';

// 👇 AGREGAMOS "job" AQUÍ
export const useRetellConnection = ({ onInterviewCompleted, application, user, job }) => {
  const [callState, setCallState] = useState("idle");
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
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch (err) {
      console.error("Failed to get user media for visualizer:", err);
      setError("No se pudo acceder al micrófono. Revisa los permisos.");
      setCallState("error");
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
    if (callState !== 'idle' && callState !== 'error' && callState !== 'ended') return;

    setCallState("connecting");
    setError(null);
    setTranscript([]);

    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'interviewing' })
        .eq('id', application.id);

      if (updateError) throw new Error(`DB Error: ${updateError.message}`);

      console.log("Initializing Retell client...");
      const client = new RetellWebClient();
      retellClientRef.current = client;

      client.on("conversationStarted", () => {
        console.log("Event: conversationStarted");
        clearTimeout(connectionTimeoutRef.current);
        setCallState("connected");
      });

      client.on("conversationEnded", ({ code, reason, call }) => {
        console.log(`Event: conversationEnded - Code: ${code}, Reason: ${reason}`);
        console.log("Full call details:", call);
        setCallState("ended");
        stopInterview(true, call);
      });

      client.on("error", (error) => {
        console.error("Retell Client Error:", error);
        setError(error.message || "Ocurrió un error en la llamada.");
        setCallState("error");
        cleanup();
      });

      client.on("update", (update) => {
        if (update.transcript && update.transcript.length > 0) {
          setTranscript(prev => [...prev, ...update.transcript]);
        }
        setIsAgentSpeaking(update.turntaking === "agent");
      });

      console.log("Requesting access token from Supabase function...");

      // 👇 AQUI ENVIAMOS NOMBRE DEL CANDIDATO Y REQUISITOS
      const candidateName =
        user?.user_metadata?.full_name ||
        user?.email ||
        "Candidato";

      const jobTitle = job?.title || "";
      const jobRequirements = job?.requirements || [];

      const { data, error: funcError } = await supabase.functions.invoke('create-web-call', {
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

      if (funcError) throw new Error(`Supabase Error: ${funcError.message}`);
      if (data.error) throw new Error(`Server Error: ${data.error}`);

      console.log("Token received. Starting Retell call...");

      const { access_token } = data;
      if (!access_token) {
        throw new Error("Did not receive access_token from server.");
      }

      connectionTimeoutRef.current = setTimeout(() => {
        setError("La conexión tardó demasiado. Inténtalo de nuevo.");
        setCallState("error");
        cleanup();
      }, 180000);

      await client.startCall({ accessToken: access_token });

    } catch (err) {
      console.error("Failed to start interview:", err);
      setError(err.message);
      setCallState("error");
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
          status: 'reviewed',
          call_id: callDetails.call_id,
          duration: callDetails.duration,
          recording_url: callDetails.recording_url,
          retell_llm_response_data: callDetails,
        };

        const { error: updateError } = await supabase
          .from('applications')
          .update(updatePayload)
          .eq('id', application.id);

        if (updateError) throw updateError;
        console.log("Interview data saved successfully.");
      } catch (err) {
        console.error("Failed to save interview data:", err);
      }
    }

    cleanup();
    setCallState("ended");
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