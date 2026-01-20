import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const AgentAvatar = ({ isSpeaking }) => {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={{ scale: isSpeaking ? 1.15 : 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-full bg-cyan-500 p-6 shadow-xl"
      >
        <Bot className="h-12 w-12 text-white" />
      </motion.div>

      <p className="text-sm text-slate-400 mt-2">
        {isSpeaking ? "Hablando…" : "Esperando…"}
      </p>
    </div>
  );
};

export default AgentAvatar;