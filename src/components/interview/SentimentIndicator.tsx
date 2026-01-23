import React from "react";
import { motion } from "framer-motion";
import { Smile, Meh, Frown } from "lucide-react";

interface SentimentConfig {
  icon: JSX.Element;
  color: string;
  label: string;
}

const sentimentConfig: Record<string, SentimentConfig> = {
  positive: { icon: <Smile />, color: "text-green-400", label: "Positivo" },
  neutral: { icon: <Meh />, color: "text-yellow-400", label: "Neutral" },
  negative: { icon: <Frown />, color: "text-red-400", label: "Negativo" },
  idle: { icon: <Meh />, color: "text-slate-500", label: "Analizando..." }
};

interface SentimentIndicatorProps {
  sentiment?: string;
}

const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({
  sentiment = "idle"
}) => {
  const config = sentimentConfig[sentiment] || sentimentConfig.idle;

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <motion.div
        key={sentiment}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center gap-2 p-2 rounded-full bg-slate-800/50 border border-slate-700 ${config.color}`}
      >
        {React.cloneElement(config.icon, {
          size: 16
        } as React.SVGProps<SVGSVGElement>)}
        <span className="hidden sm:inline">{config.label}</span>
      </motion.div>
    </div>
  );
};

export default SentimentIndicator;
