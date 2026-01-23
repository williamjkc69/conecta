import React from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  PhoneOff,
  Loader2,
  RotateCcw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface InterviewControlsProps {
  callState: "idle" | "connecting" | "connected" | "ended" | "error";
  startInterview: () => void;
  stopInterview: (confirmed?: boolean) => void;
  interviewStatus: string;
  canInterview: boolean;
}

const InterviewControls: React.FC<InterviewControlsProps> = ({
  callState,
  startInterview,
  stopInterview,
  interviewStatus,
  canInterview
}) => {
  const isIdle = callState === "idle";
  const isEnded = callState === "ended";
  const isError = callState === "error";
  const isConnecting = callState === "connecting";
  const isConnected = callState === "connected";

  // 3) Ensure button "Realizar entrevista" ONLY appears when canInterview === true.
  if (isIdle || isEnded || isError) {
    if (!canInterview) {
      // If cannot interview, show status message instead of button
      if (interviewStatus === "completed" || interviewStatus === "reviewed") {
        return (
          <div className="text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">
              Entrevista Completada
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Gracias por completar la entrevista. Tus respuestas han sido
              guardadas.
            </p>
          </div>
        );
      }

      return (
        <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-slate-400">
            No es posible iniciar la entrevista en este momento.
            <br />
            <span className="text-xs text-slate-500">
              Estado actual: {interviewStatus}
            </span>
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-4 w-full">
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50 mb-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              Ocurrió un error. Por favor intenta de nuevo.
            </span>
          </motion.div>
        )}

        {isEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 mb-2 font-medium flex items-center gap-2"
          >
            <span>Sesión finalizada.</span>
          </motion.div>
        )}

        <p className="text-slate-400 text-sm max-w-sm text-center">
          {isEnded
            ? "Puedes reanudar la entrevista si fue interrumpida."
            : "Se solicitarán permisos de micrófono. La sesión será grabada."}
        </p>

        <Button
          onClick={startInterview}
          size="lg"
          className={`
            w-full max-w-xs mx-auto font-semibold transition-all shadow-lg
            ${isError ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-cyan-500/20"}
          `}
        >
          {isError ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4" /> Reintentar Conexión
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              {interviewStatus === "in_progress"
                ? "Continuar Entrevista"
                : "Realizar Entrevista"}
            </>
          )}
        </Button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-200">
          Conectando con Alex...
        </h3>
        <p className="text-slate-500 text-sm mt-2">
          Configurando entorno de entrevista seguro
        </p>
      </div>
    );
  }

  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center w-full"
      >
        <div className="mb-6 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-green-400 text-sm font-medium">
            Entrevista en curso
          </span>
        </div>

        <Button
          onClick={() => stopInterview(true)}
          variant="destructive"
          size="lg"
          className="rounded-full w-48 h-16 text-lg font-semibold shadow-lg shadow-red-500/20 hover:bg-red-600 hover:scale-105 transition-all"
        >
          <PhoneOff className="h-6 w-6 mr-2" /> Finalizar
        </Button>

        <p className="text-slate-500 text-xs mt-4">
          La entrevista finalizará y se guardará el registro.
        </p>
      </motion.div>
    );
  }

  return null;
};

export default InterviewControls;
