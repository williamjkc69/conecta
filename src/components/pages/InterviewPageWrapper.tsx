"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInterviewStore } from "@/store/interviewStore";
// @ts-ignore
import InterviewPage from "./InterviewPage";
import { Loader2 } from "lucide-react";
import React from "react";
import { useToast } from "@/components/ui/use-toast";

export default function InterviewPageWrapper({
  applicationId
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const { setReportData } = useInterviewStore();
  const { toast } = useToast();

  const handleCompletion = async (reportData: any) => {
    setReportData(reportData);

    if (user?.email) {
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "interview_completed",
            to: user.email,
            payload: {
              candidateName:
                user.user_metadata?.full_name ||
                user.app_metadata?.full_name ||
                "Candidato",
              dashboardUrl: `${window.location.origin}/candidate-dashboard`
            }
          })
        });
        toast({
          title: "Entrevista completada",
          description: "Se ha enviado un correo de confirmación."
        });
      } catch (error) {
        console.error("Error sending completion email:", error);
      }
    }
    // Don't redirect - let user stay on interview page with "ended" state
  };

  // If loading or no user (and auth middleware hasn't redirected yet - though we don't have middleware yet)
  // We can show loading or redirect logic.
  // Ideally HomePageWrapper logic handled access, but if direct access to /interview/:id
  // We should rely on Providers initialization.

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login or home if not auth
    // But since this is a client component, we can use router.push in useEffect
    // For now simple return.
    // In useEffect:
    // router.push('/');
    // return null;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <p>Debes iniciar sesión para acceder a la entrevista.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-cyan-400 underline"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <InterviewPage
      user={user}
      applicationId={applicationId}
      onInterviewCompleted={handleCompletion}
    />
  );
}
