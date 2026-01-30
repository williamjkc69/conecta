import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface InterviewHeaderProps {
  jobTitle?: string;
  loading: boolean;
}

const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  jobTitle,
  loading
}) => {
  return (
    <motion.div
      className="text-center mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold gradient-text">
        Entrevista de Evaluación
      </h2>
      {loading ? (
        <div className="flex items-center justify-center mt-3">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-slate-400 text-lg">
            Cargando detalles de la vacante...
          </span>
        </div>
      ) : jobTitle ? (
        <p className="text-slate-400 text-lg mt-2">Vacante: {jobTitle}</p>
      ) : (
        <p className="text-red-400 text-lg mt-2">
          No se pudo cargar el título de la vacante.
        </p>
      )}
    </motion.div>
  );
};

export default InterviewHeader;
