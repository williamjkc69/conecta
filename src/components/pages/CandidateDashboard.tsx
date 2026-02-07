"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  DollarSign,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Sparkles,
  User as UserIcon,
  Clock,
  Eye
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import CandidateJobDetailModal from "@/components/features/CandidateJobDetailModal";
import { useCandidateApplications } from "@/hooks/useCandidateApplications";
import ApplicationCard from "@/components/features/ApplicationCard";
import CandidateOnboardingModal from "@/components/features/CandidateOnboardingModal";
import { BUTTONS, TITLES, MESSAGES, LABELS } from "@/constants/text";
import { CANDIDATE_STATUS_LABELS } from "@/constants/options";

/*
  TEST CHECKLIST:
  [ ] Pending: Shows "A la espera de invitación", no buttons.
  [ ] Invited: Shows "Invitación Recibida", "Realizar entrevista" button visible.
  [ ] In Progress: Shows "Entrevista en curso", "Continuar Entrevista" button visible.
  [ ] Completed: Shows "Proceso Finalizado", no start buttons.
*/

const StatusTimeline = ({ status }: { status: string }) => {
  // Visualization steps requested by user
  // Postulado = invited
  // En Entrevista = interviewing
  // En Revisión = completed
  // Contratado/Rechazado = approved/rejected

  const steps = [
    { id: "invited", label: "Postulado" },
    { id: "interviewing", label: "En Entrevista" },
    { id: "completed", label: "En Revisión" },
    { id: "decision", label: "Respuesta" } // Will display Contratado/Rechazado dynamically
  ];

  let currentStepIndex = 0;
  let decisionLabel = "Respuesta";
  let decisionColor = "bg-slate-700"; // Default gray

  if (status === "invited") {
    currentStepIndex = 0;
  } else if (status === "interviewing") {
    currentStepIndex = 1;
  } else if (status === "completed") {
    currentStepIndex = 2;
  } else if (status === "approved") {
    currentStepIndex = 3;
    decisionLabel = "Contratado";
    decisionColor = "bg-green-500";
  } else if (status === "rejected") {
    currentStepIndex = 3;
    decisionLabel = "No Seleccionado";
    decisionColor = "bg-red-500";
  } else if (status === "pending") {
    // Treat 'pending' as equivalent to invited or just applied for now
    currentStepIndex = 0;
  }

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        let circleColor = "bg-slate-700";
        if (isCompleted) circleColor = "bg-cyan-500";
        else if (isCurrent) {
          if (step.id === "decision" && status === "rejected")
            circleColor = "bg-red-500";
          else if (step.id === "decision" && status === "approved")
            circleColor = "bg-green-500";
          else circleColor = "bg-cyan-500";
        }

        const label =
          step.id === "decision" &&
          (status === "approved" || status === "rejected")
            ? decisionLabel
            : step.label;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${circleColor}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : null}
              </div>
              <span
                className={`mt-2 text-xs text-center ${
                  index <= currentStepIndex
                    ? "text-slate-100 font-semibold"
                    : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  index < currentStepIndex ? "bg-cyan-500" : "bg-slate-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const InterviewSchedule = ({
  scheduledAt,
  interviewStatus
}: {
  scheduledAt: string;
  interviewStatus: string;
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (interviewStatus === "completed") {
    return (
      <div className="flex items-center gap-3 text-slate-400">
        <Check className="w-5 h-5 text-green-500" />
        <p>{MESSAGES.INTERVIEW_COMPLETED}</p>
      </div>
    );
  }

  if (!scheduledAt) {
    return (
      <div className="flex items-center gap-3 text-slate-400">
        <Calendar className="w-5 h-5 text-cyan-400" />
        <p>{MESSAGES.INTERVIEW_FLEXIBLE}</p>
      </div>
    );
  }

  const scheduledDate = new Date(scheduledAt);
  const isUpcoming = scheduledDate > now;
  const diffTime = Math.abs(scheduledDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

  let timeText = "";
  if (isUpcoming) {
    if (diffDays > 1)
      timeText = `${MESSAGES.STARTS_PREFIX} ${diffDays} ${MESSAGES.DAYS_UNIT}`;
    else if (diffHours > 1)
      timeText = `${MESSAGES.STARTS_PREFIX} ${diffHours} ${MESSAGES.HOURS_UNIT}`;
    else timeText = MESSAGES.STARTS_SOON;
  } else {
    timeText = MESSAGES.INTERVIEW_PAST;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-cyan-400" />
        <div>
          <p className="font-semibold text-slate-100">
            {scheduledDate.toLocaleString("es-ES", {
              dateStyle: "full",
              timeStyle: "short"
            })}
          </p>
          <p
            className={`text-sm ${isUpcoming ? "text-green-400" : "text-yellow-400"}`}
          >
            {timeText}
          </p>
        </div>
      </div>
    </div>
  );
};

const CandidateDashboard = () => {
  const { user, profile, signOut, fetchProfile } = useAuthStore();
  const router = useRouter();

  const { applications, loading } = useCandidateApplications(profile?.id);

  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Check if candidate needs to complete onboarding
  const needsOnboarding = Boolean(
    profile && profile.id && !profile.document_number
  );

  useEffect(() => {
    if (applications.length > 0) {
      if (selectedApplication) {
        const updated = applications.find(
          (app) => app.id === selectedApplication.id
        );
        if (updated) {
          if (
            updated.interview_status !== selectedApplication.interview_status ||
            updated.status !== selectedApplication.status
          ) {
            console.log(
              `[${new Date().toISOString()}] [Dashboard] Updating selected application from realtime data`,
              updated
            );
            setSelectedApplication(updated);
          }
        }
      } else {
        setSelectedApplication(applications[0]);
      }
    }
  }, [applications, selectedApplication]);

  const handleStartInterview = (application: any) => {
    console.log(
      `[${new Date().toISOString()}] [Dashboard] Navigating to interview: ${application.id}`
    );
    router.push(`/interview/${application.id}`);
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || ""
    );
  };

  useEffect(() => {
    if (selectedApplication) {
      console.log(
        `[${new Date().toISOString()}] [Dashboard] Selected App State:`
      );
      console.log(`   - ID: ${selectedApplication.id}`);
      console.log(`   - Status: ${selectedApplication.status}`);
      console.log(
        `   - Interview Status: ${selectedApplication.interview_status}`
      );
    }
  }, [selectedApplication]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-slate-900" />
            </div>
            <h1 className="text-xl font-bold gradient-text">
              {TITLES.CANDIDATE_DASHBOARD}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 hidden sm:block">
              {MESSAGES.WELCOME} {profile?.full_name?.split(" ")[0]}!
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10 border-2 border-slate-700">
                    <AvatarImage
                      src={profile?.avatar_url}
                      alt={profile?.full_name}
                    />
                    <AvatarFallback className="bg-cyan-800 text-cyan-100">
                      {getInitials(profile?.full_name || "")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-slate-800 border-slate-700 text-slate-100"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name}
                    </p>
                    <p className="text-xs leading-none text-slate-400">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer focus:bg-slate-700 focus:text-slate-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{BUTTONS.LOGOUT}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-grow flex max-w-screen-2xl mx-auto w-full overflow-hidden">
        <aside className="w-1/3 xl:w-1/4 h-full overflow-y-auto border-r border-slate-800 p-4 space-y-4 hidden md:block">
          <h2 className="text-lg font-semibold px-2 text-slate-300">
            {TITLES.MY_APPLICATIONS} ({applications.length})
          </h2>
          {applications.length > 0 ? (
            applications.map((app) => (
              <motion.div
                key={app.id}
                layout
                onClick={() => setSelectedApplication(app)}
                className={`p-4 rounded-lg cursor-pointer border-2 transition-all duration-200 ${selectedApplication?.id === app.id ? "bg-blue-900/30 border-cyan-500 shadow-lg shadow-cyan-900/20" : "bg-slate-800/30 border-transparent hover:border-slate-700 hover:bg-slate-800/50"}`}
              >
                <h3 className="font-bold text-md text-slate-100">
                  {app.jobTitle}
                </h3>
                <p className="text-sm text-slate-400">{app.companyName}</p>
                <div className="flex justify-between items-center mt-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-slate-600 text-slate-400"
                  >
                    {app.created_at
                      ? new Date(app.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })
                      : "N/A"}
                  </Badge>
                  {app.interview_status === "invited" && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-10 px-4 rounded-lg bg-slate-800/50 border border-slate-700 border-dashed">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-500" />
              <h3 className="mt-2 text-sm font-medium text-slate-300">
                {MESSAGES.NO_APPLICATIONS}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {MESSAGES.NO_APPLICATIONS_DESC}
              </p>
              <Button
                onClick={() => router.push("/")}
                className="mt-4"
                size="sm"
                variant="secondary"
              >
                {BUTTONS.SEARCH_JOBS}
              </Button>
            </div>
          )}
        </aside>

        <main className="w-full md:w-2/3 xl:w-3/4 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {selectedApplication ? (
              <motion.div
                key={selectedApplication.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className="bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {selectedApplication.type}
                      </Badge>
                      {selectedApplication.interview_status === "invited" && (
                        <Badge className="bg-cyan-500 text-black hover:bg-cyan-400">
                          {LABELS.ACTION_REQUIRED}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-3xl font-extrabold text-white leading-tight">
                      {selectedApplication.jobTitle}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 mt-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-cyan-500" />
                        {selectedApplication.companyName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        {selectedApplication.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-cyan-500" />
                        {selectedApplication.salary}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsDetailModalOpen(true)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white shrink-0"
                  >
                    <Eye className="w-4 h-4 mr-2" /> {BUTTONS.VIEW_JOB}
                  </Button>
                </div>

                {/* Timeline */}
                <Card className="glass-effect border-slate-700/80">
                  <CardContent className="pt-6">
                    <StatusTimeline status={selectedApplication.status} />
                  </CardContent>
                </Card>

                {/* Main Action Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <ApplicationCard
                      application={selectedApplication}
                      onStartInterview={handleStartInterview}
                    />
                  </div>

                  <div className="space-y-6">
                    <Card className="glass-effect border-slate-700/80">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {TITLES.YOUR_INFO}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <UserIcon className="w-4 h-4 text-cyan-400" />
                          <p className="text-slate-300">{profile?.full_name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <p className="text-slate-300">
                            {LABELS.DOC_SHORT}:{" "}
                            {profile?.document_number || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <p className="text-slate-300">
                            {LABELS.APPLIED_DATE}:{" "}
                            {selectedApplication.created_at
                              ? new Date(
                                  selectedApplication.created_at
                                ).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric"
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass-effect border-slate-700/80">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {TITLES.SCHEDULE}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <InterviewSchedule
                          scheduledAt={
                            selectedApplication.interview_scheduled_at
                          }
                          interviewStatus={selectedApplication.interview_status}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-200">
                  {MESSAGES.WELCOME_DASHBOARD}
                </h2>
                <p className="text-slate-500 mt-2 max-w-md">
                  {MESSAGES.DASHBOARD_DESC}
                  {applications.length > 0
                    ? ` ${MESSAGES.SELECT_APP_DESC}`
                    : ` ${MESSAGES.NO_ACTIVE_APPS}`}
                </p>
                {applications.length === 0 && (
                  <Button
                    onClick={() => router.push("/")}
                    className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    {BUTTONS.EXPLORE_JOBS}
                  </Button>
                )}
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <CandidateJobDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        application={selectedApplication}
      />

      {needsOnboarding && profile && (
        <CandidateOnboardingModal
          userId={profile.id}
          userName={profile.full_name || profile.name || "Usuario"}
          onSuccess={() => {
            if (user?.id) {
              fetchProfile(user.id); // Refresh profile after onboarding
            }
          }}
        />
      )}
    </div>
  );
};

export default CandidateDashboard;
