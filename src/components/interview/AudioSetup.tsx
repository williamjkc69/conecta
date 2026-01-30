import React, { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Volume2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioSetupProps {
  onReady: (deviceId: string) => void;
  onPermissionDenied: () => void;
}

const AudioSetup: React.FC<AudioSetupProps> = ({
  onReady,
  onPermissionDenied
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Ref for robust cleanup

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Request microphone permission and get devices
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        setStream(mediaStream);
        streamRef.current = mediaStream;
        setHasPermission(true);

        // Get available audio devices
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = deviceList.filter(
          (device) => device.kind === "audioinput"
        );
        setDevices(audioDevices);

        // Identify the actual device ID being used by the initial stream
        const initialTrack = mediaStream.getAudioTracks()[0];
        const initialSettings = initialTrack?.getSettings();
        const activeDeviceId = initialSettings?.deviceId;

        // Set default device selection to the one actively being used
        // This fixes the mismatch where 'default' might not map to the visualizer
        if (activeDeviceId) {
          setSelectedDevice(activeDeviceId);
        } else if (audioDevices.length > 0) {
          const defaultDevice =
            audioDevices.find((d) => d.deviceId === "default") ||
            audioDevices[0];
          setSelectedDevice(defaultDevice.deviceId);
        }

        // Setup audio analyzer
        setupAudioAnalyzer(mediaStream);
      } catch (err) {
        console.error("Mic permission denied:", err);
        setHasPermission(false);
        onPermissionDenied();
      }
    };

    requestMicPermission();

    return () => {
      // Cleanup using ref to ensure we capture the latest stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const setupAudioAnalyzer = (mediaStream: MediaStream) => {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    // Ensure context is running (browsers sometimes start suspended)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    updateAudioLevel();
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    // Normalize to 0-100
    const normalized = Math.min(100, (average / 128) * 100);
    setAudioLevel(normalized);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);

    // Stop current stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Get new stream with selected device
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      setStream(newStream);
      streamRef.current = newStream;
      setupAudioAnalyzer(newStream);
    } catch (err) {
      console.error("Failed to switch device:", err);
    }
  };

  const handleContinue = () => {
    // IMPORTANT: Stop the preview stream before starting the call
    // This allows Retell to request the mic with the selected device
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    console.log(
      "[AudioSetup] Cleaned up preview, passing device to Retell:",
      selectedDevice
    );
    onReady(selectedDevice);
  };

  if (hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="animate-pulse mb-4">
          <Mic className="w-12 h-12 text-cyan-400" />
        </div>
        <p className="text-slate-300">Solicitando permiso de micrófono...</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-900/20 rounded-lg border border-red-900/50">
        <MicOff className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-400 mb-2">
          Permiso Denegado
        </h3>
        <p className="text-slate-300 text-center mb-4">
          Necesitas dar permiso al micrófono para continuar con la entrevista.
        </p>
        <p className="text-sm text-slate-400 text-center">
          Por favor, actualiza los permisos del navegador y recarga la página.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 mb-4">
          <Mic className="w-5 h-5" />
          <h3 className="font-semibold">Configuración de Audio</h3>
        </div>

        {/* Microphone Selection */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400">
            Seleccionar Micrófono
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Micrófono ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>

        {/* Audio Level Visualizer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Nivel de Audio
            </label>
            <span className="text-xs text-slate-500">
              {Math.round(audioLevel)}%
            </span>
          </div>

          {/* Audio Level Bars - Google Meet style */}
          <div className="flex gap-1 h-12 items-end">
            {Array.from({ length: 20 }).map((_, i) => {
              const barThreshold = (i / 20) * 100;
              const isActive = audioLevel > barThreshold;

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all duration-100 ${
                    isActive
                      ? audioLevel > 70
                        ? "bg-red-500"
                        : audioLevel > 40
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      : "bg-slate-700"
                  }`}
                  style={{
                    height: isActive
                      ? `${40 + (audioLevel / 100) * 60}%`
                      : "20%"
                  }}
                />
              );
            })}
          </div>

          <p className="text-xs text-slate-500 text-center">
            Habla para probar tu micrófono
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-cyan-900/20 border border-cyan-900/50 rounded-md p-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-cyan-300">
              <p className="font-medium mb-1">Antes de continuar:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                <li>Asegúrate de estar en un lugar tranquilo</li>
                <li>Verifica que tu micrófono funciona correctamente</li>
                <li>La entrevista será grabada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        size="lg"
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-cyan-500/20"
      >
        <Mic className="mr-2 h-4 w-4" />
        Continuar con la Entrevista
      </Button>
    </div>
  );
};

export default AudioSetup;
