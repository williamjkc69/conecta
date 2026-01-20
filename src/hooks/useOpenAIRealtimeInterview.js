import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

export const useOpenAIRealtimeInterview = ({
  onInterviewEnd,
  user,
  jobDetails,
  application,
}) => {
  const { toast } = useToast();
  const [callState, setCallState] = useState("idle");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const transcriptRef = useRef([]);
  const analyserRef = useRef(null);
  const audioLevelFrameRef = useRef(null);

  const REALTIME_URL = import.meta.env.VITE_OPENAI_REALTIME_URL || "wss://api.openai.com/v1/realtime";
  const REALTIME_MODEL = import.meta.env.VITE_OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview-2024-10-01";

  // Logging Helper
  const log = useCallback((step, message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`%c[${timestamp}] [${step}]`, 'color: #06b6d4; font-weight: bold;', message, data || '');
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Prevent tab close during interview
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (callState === 'connected' || callState === 'connecting') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [callState]);

  const cleanup = useCallback(() => {
    log('CLEANUP', 'Releasing resources...');
    
    if (audioLevelFrameRef.current) {
        cancelAnimationFrame(audioLevelFrameRef.current);
        audioLevelFrameRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);

    if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        if(wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
            wsRef.current.close(1000, 'Client cleanup');
        }
        wsRef.current = null;
    }
    
    if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
    }

    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }

    if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(e => console.warn("Error closing AudioContext:", e));
        audioContextRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsAgentSpeaking(false);
  }, [log]);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if (!isPlayingRef.current) setIsAgentSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsAgentSpeaking(true);
    
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    
    const arrayBuffer = audioQueueRef.current.shift();

    try {
      const pcm = new Int16Array(arrayBuffer);
      const float = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) {
        float[i] = pcm[i] / 32768;
      }

      const audioBuffer = ctx.createBuffer(1, float.length, 24000);
      audioBuffer.getChannelData(0).set(float);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

      source.onended = () => {
        isPlayingRef.current = false;
        playNextInQueue();
      };
    } catch (e) {
      console.error("Error playing audio:", e);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, []);

  const startMicAndProcessor = useCallback(async () => {
    if (micStreamRef.current) return;

    log('AUDIO', 'Requesting microphone access...');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 24000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        micStreamRef.current = stream;
        log('AUDIO', 'Microphone access granted');

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
           audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        
        // Audio Level Monitoring
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const input = ctx.createMediaStreamSource(stream);
        input.connect(analyser);
        
        const updateLevel = () => {
            if (!analyserRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            audioLevelFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();

        await ctx.audioWorklet.addModule('/pcm16-worklet.js');
        const processor = new AudioWorkletNode(ctx, 'pcm16-worklet-processor');
        
        processor.port.onmessage = (event) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'input_audio_buffer.append',
                    audio: btoa(String.fromCharCode(...new Uint8Array(event.data.buffer)))
                }));
            }
        };
        
        input.connect(processor);
        processorRef.current = processor;
        log('AUDIO', 'Audio processor connected and streaming');
    } catch (err) {
        console.error("Microphone setup error:", err);
        throw new Error("Error accessing microphone: " + err.message);
    }
  }, [log]);

  const handleMessage = useCallback(async (event) => {
    if (event.data instanceof ArrayBuffer) {
      audioQueueRef.current.push(event.data);
      playNextInQueue();
      return;
    }

    try {
        const msg = JSON.parse(event.data);

        if (msg.type === "response.audio.delta") {
            const binary = Uint8Array.from(atob(msg.delta), c => c.charCodeAt(0)).buffer;
            audioQueueRef.current.push(binary);
            playNextInQueue();
        } else if (msg.type === "response.output_text.delta") {
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant") {
              return [...prev.slice(0, -1), { ...last, content: last.content + msg.delta }];
            }
            return [...prev, { role: "assistant", content: msg.delta }];
          });
        } else if (msg.type === "conversation.item.created" && msg.item.type === "message" && msg.item.role === "user") {
             const content = msg.item.content?.[0]?.text || "(Audio del usuario)";
             log('TRANSCRIPT', 'User input detected', content);
             setTranscript(prev => [...prev, { role: "user", content }]);
        } else if (msg.type === "error") {
            log('ERROR', 'OpenAI Error received', msg.error);
        }
    } catch (e) {
        console.error("Error parsing message:", e);
    }
  }, [playNextInQueue, log]);

  const startInterview = useCallback(async () => {
    if (callState !== "idle" && callState !== "ended" && callState !== "error") return;

    log('START', 'Starting interview sequence', { applicationId: application?.id });
    setCallState("connecting");
    setTranscript([]);
    setError(null);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    try {
      // Update status to in_progress
      log('DB', 'Updating status to in_progress');
      await supabase.from('applications').update({ 
          interview_status: 'in_progress',
          status: 'interviewing'
      }).eq('id', application?.id);

      log('AUTH', 'Creating OpenAI session');
      const { data, error: funcError } = await supabase.functions.invoke("create-openai-session");
      
      if (funcError) throw funcError;
      if (!data || !data.client_secret || !data.client_secret.value) {
        throw new Error("No se pudo obtener el token de sesión.");
      }

      const secret = data.client_secret.value;
      
      const ws = new WebSocket(REALTIME_URL, [
        "realtime",
        `openai-insecure-api-key.${secret}`,
        "openai-beta.realtime-v1",
      ]);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = async () => {
        log("WEBSOCKET", "Connected");
        try {
            await startMicAndProcessor();
            
            ws.send(JSON.stringify({
                type: "session.update",
                session: {
                    modalities: ["audio", "text"],
                    instructions: `You are an expert interviewer named Alex. You are screening ${user.user_metadata.full_name} for the position of ${jobDetails?.title}. Be professional but conversational. Ask one question at a time. Requirements: ${jobDetails?.requirements?.join(', ')}. Start by welcoming them.`,
                    voice: "alloy",
                    input_audio_format: "pcm16",
                    output_audio_format: "pcm16",
                    turn_detection: {
                        type: "server_vad",
                        threshold: 0.5,
                        prefix_padding_ms: 300,
                        silence_duration_ms: 500
                    }
                },
            }));

            ws.send(JSON.stringify({ type: "response.create" }));
            setCallState("connected");
            log("STATE", "Call Connected");
        } catch (err) {
            log("ERROR", "Setup error", err);
            setError(err.message);
            setCallState("error");
            cleanup();
        }
      };

      ws.onmessage = handleMessage;
      ws.onclose = (event) => {
        log("WEBSOCKET", "Closed", { code: event.code });
        if(event.code !== 1000) { 
          setError("La conexión se cerró inesperadamente.");
          setCallState("error");
        } else {
          setCallState("ended");
        }
        cleanup(); 
      };
      ws.onerror = (err) => {
          log("WEBSOCKET", "Error", err);
          setError("Error en la conexión.");
          setCallState("error");
          cleanup();
      };

    } catch (err) {
      log("ERROR", "Initialization Error", err.message);
      setError(err.message);
      setCallState("error");
      cleanup();
    }
  }, [user, jobDetails, application, handleMessage, startMicAndProcessor, REALTIME_URL, REALTIME_MODEL, callState, log, cleanup]);

  const stopInterview = useCallback(async (isFinal = true) => {
    log('STOP', 'Stopping interview', { isFinal });
    cleanup();

    if (isFinal) {
        setCallState("ended");
        
        if (application?.id) {
            setIsSaving(true);
            try {
                const currentTranscript = transcriptRef.current;
                log("DB", "Saving transcript...", { items: currentTranscript.length });

                const { error } = await supabase
                    .from('applications')
                    .update({
                        transcript: currentTranscript,
                        interview_status: 'completed',
                        status: 'reviewed'
                    })
                    .eq('id', application.id);

                if (error) throw error;

                log("DB", "Transcript saved successfully");
                toast({
                    title: "Entrevista guardada",
                    description: "La entrevista se ha guardado correctamente.",
                });

                if (onInterviewEnd) {
                    onInterviewEnd({ transcript: currentTranscript });
                }
            } catch (err) {
                console.error("Error saving interview:", err);
                log("ERROR", "Failed to save transcript", err);
                toast({
                    variant: "destructive",
                    title: "Error al guardar",
                    description: "Hubo un problema al guardar la entrevista.",
                });
            } finally {
                setIsSaving(false);
            }
        }
    }
  }, [application, onInterviewEnd, toast, cleanup, log]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { callState, isAgentSpeaking, transcript, error, startInterview, stopInterview, isSaving, audioLevel };
};