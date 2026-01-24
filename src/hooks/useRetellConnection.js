import { useState, useRef, useEffect, useCallback } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";
import { supabase } from '@/lib/supabase';
import {
  CALL_STATES,
  RETELL_EVENTS,
  AUDIO_CONFIG,
  TIMEOUTS,
  ERROR_MESSAGES,
  TABLES,
  APPLICATION_STATUS,
} from '@/constants';

// 👇 AGREGAMOS "job" AQUÍ
export const useRetellConnection = ({ onInterviewCompleted, application, user, job }) => {
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [transcript, setTranscript] = useState([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [callId, setCallId] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMicId, setSelectedMicId] = useState(null); // Store selected mic device ID

  const retellClientRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);
  const callStateRef = useRef(CALL_STATES.IDLE); // Track call state for event handlers

  const cleanup = useCallback(() => {
    console.log("Cleanup: Stopping call and media tracks.");
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    if (audioLevelIntervalRef.current) clearInterval(audioLevelIntervalRef.current);

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
    setAudioLevel(0);
  }, []);

  const initializeAudioVisualizer = useCallback(async () => {
    // Only initialize if we don't already have a stream
    if (mediaStreamRef.current) return;
    
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

      // Update audio level continuously
      audioLevelIntervalRef.current = setInterval(() => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average);
        }
      }, 100);
    } catch (err) {
      console.error("Failed to get user media for visualizer:", err);
      // Don't set error state for visualizer - let Retell handle mic access
    }
  }, []);

  // Warn user when leaving page during active call
  // Warn user when leaving page during active call
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Use ref to get current state without re-running effect
      const currentState = callStateRef.current;
      if (currentState === CALL_STATES.CONNECTED || currentState === CALL_STATES.CONNECTING) {
        const message = 'Tienes una entrevista en curso. Si sales ahora, perderás todo el progreso. ¿Estás seguro?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting, performing final cleanup.");
      
      const currentState = callStateRef.current;
      // cleanup() will stop the Retell client which ends the call
      if (currentState === CALL_STATES.CONNECTED || currentState === CALL_STATES.CONNECTING) {
        console.log("[Retell] Ending call due to page navigation/unmount");
      }
      
      cleanup();
    };
  }, [cleanup]);

  // Debug: Log all callState changes
  useEffect(() => {
    console.log(`[Retell] 📊 callState changed to: "${callState}"`);
  }, [callState]);

  // Keep callStateRef in sync with callState for event handlers
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);



  const startInterview = async () => {
    if (callState !== CALL_STATES.IDLE && callState !== CALL_STATES.ERROR && callState !== CALL_STATES.ENDED) {
      console.log(`[Retell] ⚠️ Cannot start - current state: ${callState}`);
      return;
    }

    console.log(`[Retell] 🚀 Starting interview - changing state to CONNECTING`);
    setCallState(CALL_STATES.CONNECTING);
    console.log(`[Retell] State is now: ${CALL_STATES.CONNECTING}`);
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

      // Call started event
      client.on(RETELL_EVENTS.CALL_STARTED, () => {
        console.log("[Retell] ✅ Event: call_started - CALL IS NOW CONNECTED");
        console.log("[Retell] Current callState before update:", callStateRef.current);
        clearTimeout(connectionTimeoutRef.current);
        setCallState(CALL_STATES.CONNECTED);
        console.log(`[Retell] State changed to: ${CALL_STATES.CONNECTED}`);
        console.log("[Retell] Call successfully established!");
        
        // Initialize audio visualizer AFTER Retell has mic access
        setTimeout(() => {
          console.log("[Retell] Initializing audio visualizer...");
          initializeAudioVisualizer();
        }, 1000);
      });

      // Call ended event
      client.on(RETELL_EVENTS.CALL_ENDED, (event) => {
        console.log("[Retell] Event: call_ended");
        console.log("[Retell] Event data:", event);
        
        // Extract call details from the event
        const callData = event?.call || event;
        const code = event?.code;
        const reason = event?.reason;
        
        console.log(`[Retell] Call ended - Code: ${code}, Reason: ${reason}`);
        console.log("[Retell] Call details:", callData);
        
        // If the call ended before it ever connected, treat it as an error
        if (callStateRef.current === CALL_STATES.CONNECTING) {
          console.error("[Retell] Call ended during connection phase - treating as error");
          setError(`Connection failed: ${reason || 'Unknown error'}`);
          setCallState(CALL_STATES.ERROR);
          cleanup();
          return;
        }
        
        setCallState(CALL_STATES.ENDED);
        stopInterview(true, callData);
      });

      // Error event
      client.on(RETELL_EVENTS.ERROR, (error) => {
        console.error("[Retell] Retell Client Error:", error);
        setError(error.message || ERROR_MESSAGES.CALL_FAILED);
        setCallState(CALL_STATES.ERROR);
        cleanup();
      });

      // Update event (transcript, etc)
      client.on(RETELL_EVENTS.UPDATE, (update) => {
        if (update.transcript && update.transcript.length > 0) {
          setTranscript(prev => [...prev, ...update.transcript]);
        }
        setIsAgentSpeaking(update.turntaking === "agent");
      });

      // Agent talking events for animations
      client.on(RETELL_EVENTS.AGENT_START_TALKING, () => {
        setIsAgentSpeaking(true);
      });

      client.on(RETELL_EVENTS.AGENT_STOP_TALKING, () => {
        setIsAgentSpeaking(false);
      });

      // Add listeners for all other possible events for debugging
      const allEvents = [
        'disconnect',
        'call_started',
        'call_ended', 
        'error',
        'update',
        'agent_start_talking',
        'agent_stop_talking',
        'metadata',
        'audio'
      ];

      // Log any event we haven't explicitly handled
      allEvents.forEach(eventName => {
        if (!['call_started', 'call_ended', 'error', 'update', 'agent_start_talking', 'agent_stop_talking'].includes(eventName)) {
          client.on(eventName, (...args) => {
            console.log(`[Retell] Event: ${eventName}`, args);
          });
        }
      });

      console.log("[Retell] Requesting access token from create-web-call API...");

      const candidateName =
        user?.user_metadata?.full_name ||
        user?.email ||
        "Candidato";

      const jobTitle = job?.title || "";
      const jobRequirements = job?.requirements || [];

      // Call Next.js API route
      const response = await fetch('/api/create-web-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            userId: user?.id,
            applicationId: application?.id,
            candidateName,
            jobTitle,
            jobRequirements
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Retell] API Error Response:", errorData);
        throw new Error(`[Retell] API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log("[Retell] API route response:", data);
      console.log("[Retell] Response keys:", Object.keys(data));

      const { access_token, call_id } = data;
      if (!access_token) {
        console.error("[Retell] Did not receive access_token from server. Full response:", data);
        throw new Error(ERROR_MESSAGES.NO_ACCESS_TOKEN);
      }

      // Store call ID for later use
      setCallId(call_id);
      console.log("[Retell] Call ID:", call_id);
      console.log("[Retell] Access token received (length):", access_token?.length);

      console.log("[Retell] Token received. Starting Retell call...");

      connectionTimeoutRef.current = setTimeout(() => {
        setError(ERROR_MESSAGES.CONNECTION_TIMEOUT);
        setCallState(CALL_STATES.ERROR);
        cleanup();
      }, TIMEOUTS.CONNECTION_TIMEOUT);

      // Start call with selected microphone device
      const callOptions = { accessToken: access_token };
      
      // If a specific microphone was selected, pass it as audio constraints
      if (selectedMicId) {
        console.log("[Retell] Using selected audio device:", selectedMicId);
        // Set audio constraints to use the exact device
        callOptions.audio = {
          deviceId: { exact: selectedMicId }
        };
      }

      console.log("[Retell] Starting call with options:", callOptions);
      
      try {
        await client.startCall(callOptions);
        console.log("[Retell] startCall invoked successfully.");
      } catch (startCallError) {
        console.error("[Retell] startCall failed:", startCallError);
        
        // Clear the connection timeout since we're handling the error
        clearTimeout(connectionTimeoutRef.current);
        
        // Provide a more user-friendly error message
        let errorMsg = "Failed to start call";
        if (startCallError.message?.includes("PublishTrack")) {
          errorMsg = "Could not connect to interview service. Please check your internet connection and try again.";
        } else if (startCallError.message?.includes("permission")) {
          errorMsg = "Microphone permission denied. Please allow microphone access and try again.";
        } else {
          errorMsg = startCallError.message || errorMsg;
        }
        
        setError(errorMsg);
        setCallState(CALL_STATES.ERROR);
        cleanup();
        return; // Exit early
      }

    } catch (err) {
      console.error("[Retell] Failed to start interview:", err);
      setError(err.message || ERROR_MESSAGES.START_FAILED);
      setCallState(CALL_STATES.ERROR);
      cleanup();
    }
  };

  const stopInterview = useCallback(async (isAutoEnd = false, callDetails = null) => {
    console.log(`[Retell] Stopping interview. Auto-end: ${isAutoEnd}`);
    console.log(`[Retell] Call details:`, callDetails);
    
    // Stop the call using the Retell client (this handles everything server-side)
    if (!isAutoEnd && retellClientRef.current) {
      console.log("[Retell] Stopping call via client SDK");
      retellClientRef.current.stopCall();
    }

    // Only save and trigger completion if we have valid call details
    const hasValidCallData = callDetails && (callDetails.call_id || callDetails.transcript);
    
    if (application?.id && hasValidCallData) {
      console.log("[Retell] Saving full interview data to Supabase...");
      setIsSaving(true);
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
        console.log("[Retell] Interview data saved successfully.");
        
        // Only call completion callback if we successfully saved
        onInterviewCompleted({ transcript: callDetails?.transcript });
      } catch (err) {
        console.error("[Retell] Failed to save interview data:", err);
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log("[Retell] No valid call data to save. Call may have ended prematurely.");
      if (!hasValidCallData) {
        console.warn("[Retell] Call ended without valid data - this might indicate an error or immediate disconnect");
      }
    }

    cleanup();
    setCallState(CALL_STATES.ENDED);
    setCallId(null);
  }, [application, cleanup, onInterviewCompleted, callId]);

  return {
    callState,
    transcript,
    isAgentSpeaking,
    analyser: analyserRef.current,
    audioLevel,
    error,
    callId,
    isSaving,
    setSelectedMicId, // Expose function to set selected microphone
    startInterview,
    stopInterview,
  };
};