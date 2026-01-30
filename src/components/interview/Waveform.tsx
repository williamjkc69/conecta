import React from "react";
import { motion } from "framer-motion";

interface WaveformProps {
  isSpeaking: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ isSpeaking }) => {
  const bars = [1, 2, 3, 4, 5];

  return (
    <div className="flex justify-center items-end space-x-1 h-8">
      {bars.map((b) => (
        <motion.div
          key={b}
          animate={{
            height: isSpeaking ? `${Math.random() * 20 + 10}px` : "10px"
          }}
          transition={{
            duration: 0.25,
            repeat: isSpeaking ? Infinity : 0
          }}
          className="w-1 bg-cyan-400 rounded"
        />
      ))}
    </div>
  );
};

export default Waveform;
