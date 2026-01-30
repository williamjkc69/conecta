import React from "react";
import { Volume2 } from "lucide-react";

interface AudioLevelDisplayProps {
  audioLevel: number;
}

const AudioLevelDisplay: React.FC<AudioLevelDisplayProps> = ({
  audioLevel
}) => {
  return (
    <div className="w-full max-w-md mx-auto bg-slate-800/50 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-400">
          <Volume2 className="w-4 h-4" />
          <span className="text-sm">Nivel de Audio</span>
        </div>
        <span className="text-xs text-slate-500">
          {Math.round(audioLevel)}%
        </span>
      </div>

      {/* Audio Level Bars */}
      <div className="flex gap-1 h-8 items-end">
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
                height: isActive ? `${40 + (audioLevel / 100) * 60}%` : "20%"
              }}
            />
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center mt-2">
        {audioLevel > 5 ? "Audio detectado" : "Habla para verificar tu audio"}
      </p>
    </div>
  );
};

export default AudioLevelDisplay;
