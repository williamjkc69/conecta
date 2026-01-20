import React, { useState, useEffect, useRef } from 'react';

// This hook simulates call statistics as the Retell SDK doesn't expose them directly.
// In a real-world scenario with a different WebRTC library, you would use getStats() API.
export const useCallStats = (isActive, mediaStream) => {
  const [latency, setLatency] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    // --- Latency and Connection Quality Simulation ---
    let statsInterval;
    if (isActive) {
      statsInterval = setInterval(() => {
        const randomLatency = Math.floor(Math.random() * (70 - 20 + 1)) + 20;
        setLatency(randomLatency);

        if (randomLatency < 35) setConnectionQuality('excellent');
        else if (randomLatency < 50) setConnectionQuality('good');
        else if (randomLatency < 70) setConnectionQuality('fair');
        else setConnectionQuality('poor');
      }, 2000);
    }

    // --- Audio Level Meter ---
    if (isActive && mediaStream) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          const average = dataArrayRef.current.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(Math.min(1, average / 128)); // Normalize to 0-1 range
        }
        animationFrameId.current = requestAnimationFrame(updateAudioLevel);
      };

      animationFrameId.current = requestAnimationFrame(updateAudioLevel);
      
      return () => {
        clearInterval(statsInterval);
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        if (audioContext) {
            audioContext.close();
        }
      };
    } else {
        setAudioLevel(0);
    }
    
    return () => clearInterval(statsInterval);
  }, [isActive, mediaStream]);

  return { latency, connectionQuality, audioLevel };
};