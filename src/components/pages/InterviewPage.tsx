"use client";
// @ts-nocheck - Application type comes from hook with @ts-ignore, suppressing cascading errors

import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInterviewState } from "@/hooks/useInterviewState";
import AgentAvatar from "@/components/interview/AgentAvatar";
import Waveform from "@/components/interview/Waveform";
import ConnectionStatus from "@/components/interview/ConnectionStatus";
import InterviewControls from "@/components/interview/InterviewControls";
import AudioLevelDisplay from "@/components/interview/AudioLevelDisplay";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { INTERVIEW_STATUS, CANDIDATE_STATUS } from "@/constants/status";
import { RETELL_EVENTS, CALL_STATES } from "@/constants/retell";
import { AI_ROLES } from "@/constants/common";
import {
  TITLES,
  MESSAGES,
  BUTTONS,
  LABELS,
  DEBUG,
  PLACEHOLDERS
} from "@/constants/text";
import { CANDIDATE_STATUS_LABELS } from "@/constants/options";

// Visual Debug Panel for Integration Testing
const DebugPanel = ({
  application,
  callState,
  canInterview,
  isAgentSpeaking,
  audioLevel,
  transcript
}: any) => {
  const steps = [
    {
      id: 1,
      label: DEBUG.STATUS_INVITED_IN_PROGRESS,
      check: [INTERVIEW_STATUS.INVITED, INTERVIEW_STATUS.IN_PROGRESS].includes(
        application?.interview_status
      )
    },
    { id: 2, label: DEBUG.CAN_INTERVIEW, check: canInterview },
    {
      id: 3,
      label: DEBUG.CALL_CONNECTED,
      check: callState === CALL_STATES.CONNECTED
    },
    { id: 4, label: DEBUG.AUDIO_DETECTED, check: audioLevel > 5 },
    { id: 5, label: DEBUG.CONVERSATION_ACTIVE, check: transcript.length > 0 },
    {
      id: 6,
      label: DEBUG.INTERVIEW_ENDED,
      check: callState === CALL_STATES.ENDED
    },
    {
      id: 7,
      label: DEBUG.STATUS_COMPLETED,
      check: application?.interview_status === INTERVIEW_STATUS.COMPLETED
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-slate-950/90 text-xs text-slate-200 font-mono rounded-lg border border-slate-800 shadow-2xl z-50 max-w-xs backdrop-blur-md hidden md:block">
      <h3 className="font-bold mb-3 border-b border-slate-800 pb-2 text-cyan-400 flex justify-between items-center">
        <span>{DEBUG.INTEGRATION_TEST}</span>
        <span className="text-[10px] bg-slate-800 px-1 rounded">
          {TITLES.PLATFORM_VERSION}
        </span>
      </h3>

      <div className="space-y-2 mb-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            {step.check ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : (
              <Circle className="w-3 h-3 text-slate-600" />
            )}
            <span className={step.check ? "text-green-400" : "text-slate-500"}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
        <div className="flex justify-between">
          <span>{DEBUG.STATUS}:</span>{" "}
          <span className="text-white">
            {application?.interview_status || LABELS.NOT_AVAILABLE}
          </span>
        </div>
        <div className="flex justify-between">
          <span>{DEBUG.CALL}:</span>{" "}
          <span
            className={
              callState === CALL_STATES.CONNECTED
                ? "text-green-400"
                : "text-yellow-400"
            }
          >
            {callState}
          </span>
        </div>
        <div className="flex justify-between">
          <span>{DEBUG.AUDIO}:</span>{" "}
          <span className="text-white">{audioLevel?.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span>{DEBUG.MSGS}:</span>{" "}
          <span className="text-white">{transcript.length}</span>
        </div>
      </div>
    </div>
  );
};

interface InterviewPageProps {
  user: any;
  onInterviewCompleted: (data: any) => void;
  applicationId: string;
}

const InterviewPage: React.FC<InterviewPageProps> = ({
  user,
  onInterviewCompleted,
  applicationId
}) => {
  const router = useRouter();

  const {
    application,
    loading,
    error,
    callState,
    isAgentSpeaking,
    transcript,
    startInterview,
    stopInterview,
    canInterview,
    isSaving,
    audioLevel,
    setSelectedMicId
    // @ts-ignore
  } = useInterviewState({
    applicationId,
    user,
    onInterviewCompleted
  });

  const isCallActive = callState === "connecting" || callState === "connected";

  const handleStartInterview = async (deviceId?: string) => {
    const confirmed = window.confirm(MESSAGES.INTERVIEW_START_WARNING);

    if (confirmed) {
      await startInterview(deviceId);
    }
  };

  // 7) Add logging to show application.interview_status and callState
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [InterviewPage] State Update:`);
    console.log(`   - Application ID: ${applicationId}`);
    console.log(
      `   - Interview Status: ${(application as any)?.interview_status}`
    );
    console.log(`   - Call State: ${callState}`);
    console.log(`   - Can Interview: ${canInterview}`);

    // Redirection Logic
    if (!loading && application) {
      const status = (application as any).interview_status;
      const isInvited = status === INTERVIEW_STATUS.INVITED;
      const isInProgress = status === INTERVIEW_STATUS.IN_PROGRESS;

      // Check if we are locally active.
      // connecting/connected means we are in session.

      // 1. If not invited and not in progress (e.g. completed/reviewed) -> Redirect
      if (!isInvited && !isInProgress) {
        console.warn("[InterviewPage] Status invalid for entry:", status);
        router.push("/candidate-dashboard");
        return;
      }

      // 2. If in progress but call not active locally (e.g. page refresh) -> Redirect
      // Be careful: when starting, status might update before callState?
      // Typically callState updates to connecting immediately on button click.
      // But if we load page and status IS in_progress (from DB), callState IS idle. Redirect. Correct.
      if (isInProgress && !isCallActive && callState !== "ended") {
        console.warn(
          "[InterviewPage] In progress but call idle (refresh detected). Redirecting."
        );
        router.push("/candidate-dashboard");
        return;
      }
    }
  }, [application, callState, canInterview, applicationId, loading, router]);

  const candidateName =
    user?.user_metadata?.full_name || PLACEHOLDERS.GENERIC_CANDIDATE;
  const interviewDate = new Date().toLocaleDateString(LABELS.LOCALE_ES, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const mergedTranscript = useMemo(() => {
    const result: any[] = [];
    let current: any = null;
    for (const item of transcript as any[]) {
      if (current && current.role === item.role) {
        current.content += item.content;
      } else {
        if (current) result.push(current);
        current = { ...item };
      }
    }
    if (current) result.push(current);
    return result;
  }, [transcript]);

  const getStatusBadge = (status: string, currentCallState?: string) => {
    // If the call has ended locally, show completed immediately
    if (currentCallState === CALL_STATES.ENDED) {
      return (
        <Badge
          variant="secondary"
          className="bg-green-900 text-green-200 border-green-700"
        >
          {LABELS.FINISHED}
        </Badge>
      );
    }

    switch (status) {
      case INTERVIEW_STATUS.INVITED:
        return (
          <Badge
            variant="secondary"
            className="bg-blue-900 text-blue-200 border-blue-700"
          >
            {CANDIDATE_STATUS_LABELS.invited}
          </Badge>
        );
      case CANDIDATE_STATUS.APPLIED:
        return (
          <Badge
            variant="secondary"
            className="bg-cyan-900 text-cyan-200 border-cyan-700"
          >
            {LABELS.READY}
          </Badge>
        );
      case CANDIDATE_STATUS.INTERVIEWING:
      case INTERVIEW_STATUS.IN_PROGRESS:
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-900 text-yellow-200 border-yellow-700"
          >
            {LABELS.INTERVIEW_IN_PROGRESS}
          </Badge>
        );
      case CANDIDATE_STATUS.REVIEWED:
      case INTERVIEW_STATUS.COMPLETED:
        return (
          <Badge
            variant="secondary"
            className="bg-green-900 text-green-200 border-green-700"
          >
            {LABELS.FINISHED}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-400">
            {status || LABELS.UNKNOWN}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
        <h1 className="text-2xl font-bold">{MESSAGES.LOADING_INTERVIEW}</h1>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{TITLES.ACCESS_ERROR}</h1>
        <p className="text-slate-400 mb-6 text-center">
          {(error as any)?.message || MESSAGES.NO_APP_INFO}
        </p>
        <Button
          onClick={() => router.push("/candidate-dashboard")}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {BUTTONS.BACK_DASHBOARD}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      <DebugPanel
        application={application}
        callState={callState}
        canInterview={canInterview}
        isAgentSpeaking={isAgentSpeaking}
        audioLevel={audioLevel}
        transcript={transcript}
      />

      <header className="w-full max-w-4xl text-center mb-6 relative">
        {/* Hide back button if call is active (connecting or connected) */}
        {!isCallActive && (
          <Button
            variant="ghost"
            className="absolute left-0 top-0 text-slate-400 hover:text-white hidden md:flex"
            onClick={() => {
              // Standard navigation back
              router.push("/candidate-dashboard");
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {BUTTONS.EXIT}
          </Button>
        )}
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">
          {(application as any)?.jobs?.title || TITLES.EVALUATION_INTERVIEW}
        </h1>
        <p className="text-slate-400 text-sm md:text-base mb-3">
          {candidateName} | {interviewDate}
        </p>

        <div className="flex justify-center items-center gap-2">
          <span className="text-sm text-slate-400">{LABELS.STATUS}:</span>
          {getStatusBadge(
            (application as any)?.interview_status ||
              (application as any)?.status,
            callState
          )}
        </div>
      </header>

      <main className="w-full max-w-2xl flex flex-col items-center justify-center flex-grow space-y-6">
        <AgentAvatar isSpeaking={isAgentSpeaking} />
        <Waveform isSpeaking={isAgentSpeaking} />
        <ConnectionStatus state={callState as any} />

        {/* Show audio level during call */}
        {callState === "connected" && (
          <AudioLevelDisplay audioLevel={audioLevel || 0} />
        )}

        <div className="w-full max-w-md pt-4">
          {isSaving ? (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
              <p className="text-slate-300 font-medium">
                {MESSAGES.SAVING_INTERVIEW}
              </p>
              <p className="text-slate-500 text-sm">
                {MESSAGES.DO_NOT_CLOSE_WINDOW}
              </p>
            </div>
          ) : (
            <InterviewControls
              callState={callState as any}
              startInterview={handleStartInterview}
              stopInterview={stopInterview}
              interviewStatus={(application as any)?.interview_status}
              canInterview={canInterview}
              setSelectedMicId={setSelectedMicId}
            />
          )}
        </div>

        {/* <AnimatePresence>
          {mergedTranscript.length > 0 &&
            callState === CALL_STATES.CONNECTED && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-xl h-40 bg-slate-800/50 rounded-lg p-4 overflow-y-auto mt-4 border border-slate-700"
              >
                {mergedTranscript.map((entry: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 mb-2 ${entry.role === AI_ROLES.USER ? "justify-end" : "justify-start"}`}
                  >
                    {entry.role === AI_ROLES.ASSISTANT && (
                      <span className="text-cyan-400 font-bold text-sm">
                        Jennifer:
                      </span>
                    )}
                    <p
                      className={`text-sm ${entry.role === AI_ROLES.USER ? "text-slate-300 text-right" : "text-slate-100"}`}
                    >
                      {entry.content}
                    </p>
                    {entry.role === AI_ROLES.USER && (
                      <span className="text-blue-400 font-bold text-sm">
                        Tú:
                      </span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
        </AnimatePresence> */}
      </main>
    </div>
  );
};

export default InterviewPage;
