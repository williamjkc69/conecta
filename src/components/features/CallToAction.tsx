import React from "react";
import { motion } from "framer-motion";
import { MESSAGES } from "@/constants/text";

const CallToAction: React.FC = () => {
  return (
    <motion.p
      className="text-md text-white max-w-lg mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      {MESSAGES.CALL_TO_ACTION}
    </motion.p>
  );
};

export default CallToAction;
