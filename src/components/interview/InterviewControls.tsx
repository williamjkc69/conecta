import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  PhoneOff,
  Loader2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Home
} from "lucide-react";
import { motion } from "framer-motion";
import AudioSetup from "./AudioSetup";
import { useRouter } from "next/navigation";
import { TITLES, MESSAGES, BUTTONS, LABELS } from "@/constants/text";

interface InterviewControlsProps {
  callState: "idle" | "connecting" | "connected" | "ended" | "error";
  startInterview: (deviceId?: string) => void;
  stopInterview: (confirmed?: boolean) => void;
  interviewStatus: string;
  canInterview: boolean;
  setSelectedMicId?: (deviceId: string) => void;
}

const InterviewControls: React.FC<InterviewControlsProps> = ({
  callState,
  startInterview,
  stopInterview,
  interviewStatus,
  canInterview,
  setSelectedMicId
}) => {
  const router = useRouter();
  const [showSetup, setShowSetup] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  const isIdle = callState === "idle";
  const isEnded = callState === "ended";
  const isError = callState === "error";
  const isConnecting = callState === "connecting";
  const isConnected = callState === "connected";

  // Handle audio setup completion
  const handleAudioReady = (deviceId: string) => {
    console.log("Audio setup complete, device:", deviceId);
    // Set the selected microphone device ID
    if (setSelectedMicId) {
      setSelectedMicId(deviceId);
    }
    setShowSetup(false);
    startInterview(deviceId); // Pass directly to avoid race condition with state update
  };

  const handlePermissionDenied = () => {
    setHasPermission(false);
    setShowSetup(false);
  };

  // If showing audio setup
  if (showSetup) {
    return (
      <AudioSetup
        onReady={handleAudioReady}
        onPermissionDenied={handlePermissionDenied}
      />
    );
  }

  // Show "Interview Ended" state with back to dashboard button
  if (isEnded) {
    return (
      <div className="flex flex-col items-center space-y-4 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {TITLES.INTERVIEW_COMPLETED}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {MESSAGES.INTERVIEW_COMPLETED_DESC}
          </p>
          <Button
            onClick={() => router.push("/candidate-dashboard")}
            size="lg"
            className="w-full max-w-xs mx-auto font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-cyan-500/20"
          >
            <Home className="mr-2 h-4 w-4" /> {BUTTONS.BACK_DASHBOARD}
          </Button>
        </motion.div>
      </div>
    );
  }

  // 3) Ensure button "Realizar entrevista" ONLY appears when canInterview === true.
  if (isIdle || isError) {
    if (!canInterview) {
      // If cannot interview, show status message instead of button
      if (interviewStatus === "completed" || interviewStatus === "reviewed") {
        return (
          <div className="text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">
              {TITLES.INTERVIEW_COMPLETED}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {MESSAGES.INTERVIEW_COMPLETED_DESC}
            </p>
          </div>
        );
      }

      return (
        <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-slate-400">
            {MESSAGES.CANNOT_START_INTERVIEW}
            <br />
            <span className="text-xs text-slate-500">
              {LABELS.CURRENT_STATUS}: {interviewStatus}
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
            <span className="text-sm">{MESSAGES.GENERIC_ERROR}</span>
          </motion.div>
        )}

        {!hasPermission && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-orange-400 bg-orange-900/20 px-4 py-2 rounded-lg border border-orange-900/50 mb-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{MESSAGES.MIC_PERMISSION_REQUIRED}</span>
          </motion.div>
        )}

        <p className="text-slate-400 text-sm max-w-sm text-center">
          {MESSAGES.MIC_EXPLANATION}
        </p>

        <Button
          onClick={() => {
            // Retry setup logic
            setShowSetup(true);
          }}
          disabled={false}
          size="lg"
          className={`
            w-full max-w-xs mx-auto font-semibold transition-all shadow-lg
            ${isError ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-cyan-500/20"}
          `}
        >
          {isError ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4" /> {BUTTONS.RETRY_CONNECTION}
            </>
          ) : !hasPermission ? (
            <>
              <Mic className="mr-2 h-4 w-4" />
              {BUTTONS.ENABLE_MIC}
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              {interviewStatus === "in_progress"
                ? BUTTONS.CONTINUE_INTERVIEW
                : BUTTONS.START_INTERVIEW}
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
          {MESSAGES.CONNECTING_AGENT}
        </h3>
        <p className="text-slate-500 text-sm mt-2">
          {MESSAGES.CONFIGURING_ENV}
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
            {LABELS.INTERVIEW_IN_PROGRESS}
          </span>
        </div>

        <Button
          onClick={() => stopInterview(true)}
          variant="destructive"
          size="lg"
          className="rounded-full w-48 h-16 text-lg font-semibold shadow-lg shadow-red-500/20 hover:bg-red-600 hover:scale-105 transition-all"
        >
          <PhoneOff className="h-6 w-6 mr-2" /> {BUTTONS.FINISH}
        </Button>

        <p className="text-slate-500 text-xs mt-4">{MESSAGES.FINISH_WARNING}</p>
      </motion.div>
    );
  }

  return null;
};

export default InterviewControls;
