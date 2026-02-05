import React from "react";
import { motion } from "framer-motion";
import { MESSAGES } from "@/constants/text";

const WelcomeMessage: React.FC = () => {
  return (
    <motion.p
      className="text-xl md:text-2xl text-white max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {MESSAGES.WELCOME_AI}{" "}
      <span className="font-semibold text-purple-300">Jennifer</span>,{" "}
      {MESSAGES.WELCOME_AI_SUBTITLE}
    </motion.p>
  );
};

export default WelcomeMessage;
