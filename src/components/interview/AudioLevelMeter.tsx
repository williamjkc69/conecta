import React from "react";
import { motion } from "framer-motion";

interface AudioLevelMeterProps {
  audioLevel: number;
}

const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({ audioLevel }) => {
  const bars = Array.from({ length: 12 });

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-300">Nivel de Audio</span>
      <div className="flex items-center gap-1">
        {bars.map((_, i) => {
          const isActive = i / bars.length < audioLevel;
          return (
            <motion.div
              key={i}
              className="h-4 w-1.5 rounded-full"
              animate={{
                backgroundColor: isActive
                  ? i < 8
                    ? "#34d399"
                    : "#f59e0b" // green to amber
                  : "#475569" // slate-600
              }}
              transition={{ duration: 0.05 }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AudioLevelMeter;
