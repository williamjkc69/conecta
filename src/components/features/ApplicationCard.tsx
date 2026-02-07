import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TITLES, MESSAGES, BUTTONS, LABELS } from "@/constants/text";

interface ApplicationCardProps {
  application: any;
  onStartInterview: (app: any) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onStartInterview
}) => {
  useEffect(() => {
    if (application) {
      const timestamp = new Date().toISOString();
      console.log(
        `[${timestamp}] [ApplicationCard] Rendering for App ID: ${application.id}`
      );
      console.log(`   - Interview Status: ${application.interview_status}`);
      console.log(`   - Main Status: ${application.status}`);
    }
  }, [application]);

  if (!application) return null;

  const interviewStatus = application.interview_status || "pending";
  const mainStatus = application.status;

  // 1. Completed / Reviewed / Approved / Rejected
  if (
    interviewStatus === "completed" ||
    mainStatus === "completed" ||
    mainStatus === "approved" ||
    mainStatus === "rejected"
  ) {
    let badgeText = "En Revisión";
    let badgeColor = "border-blue-500/50 text-blue-400 bg-blue-900/10";
    let titleText = "En Revisión";
    let descText =
      "Tu entrevista ha finalizado. Estamos revisando tus resultados.";
    let icon = <Clock className="w-6 h-6 text-blue-500" />;

    if (mainStatus === "approved") {
      badgeText = "Contratado";
      badgeColor = "border-green-500/50 text-green-400 bg-green-900/10";
      titleText = "¡Felicidades!";
      descText =
        "Has sido seleccionado para esta posición. Nos pondremos en contacto contigo pronto.";
      icon = <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (mainStatus === "rejected") {
      badgeText = "No Seleccionado";
      badgeColor = "border-red-500/50 text-red-400 bg-red-900/10";
      titleText = "Proceso Finalizado";
      descText =
        "Gracias por tu interés, pero hemos decidido avanzar con otros candidatos.";
      icon = <CheckCircle className="w-6 h-6 text-red-500" />; // Or X icon if available, standardizing on CheckCircle for completed process implies 'Done'
    } else {
      // Default completed/reviewed
      badgeText = "En Revisión";
      titleText = "Proceso Finalizado";
      descText =
        "Tu entrevista ha finalizado. El equipo está revisando tu perfil.";
      icon = <CheckCircle className="w-6 h-6 text-blue-500" />;
    }

    console.log(
      `[${new Date().toISOString()}] [ApplicationCard] Rendering COMPLETED/DECISION branch: ${mainStatus}`
    );
    return (
      <Card className="glass-effect border-slate-700/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
          <Badge variant="outline" className={badgeColor}>
            {badgeText}
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            {icon}
            {titleText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">{descText}</p>
        </CardContent>
      </Card>
    );
  }

  // 2. Invited -> Show "Realizar entrevista"
  if (interviewStatus === "invited") {
    console.log(
      `[${new Date().toISOString()}] [ApplicationCard] Rendering INVITED branch`
    );
    return (
      <Card className="bg-gradient-to-br from-blue-900 to-cyan-900 border-cyan-700 shadow-lg shadow-cyan-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
          <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 border-none">
            {LABELS.ACTION_REQUIRED}
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            {TITLES.INVITATION_RECEIVED}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-100 mb-6">{MESSAGES.INVITATION_DESC}</p>
          <Button
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg py-6 shadow-xl transition-all hover:scale-105"
            onClick={() => onStartInterview(application)}
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            {BUTTONS.START_INTERVIEW}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 3. In Progress -> Show "Entrevista en curso"
  if (interviewStatus === "in_progress") {
    console.log(
      `[${new Date().toISOString()}] [ApplicationCard] Rendering IN_PROGRESS branch`
    );
    return (
      <Card className="bg-slate-800 border-yellow-600/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
          <Badge
            variant="outline"
            className="border-yellow-500/50 text-yellow-400 bg-yellow-900/10 animate-pulse"
          >
            {LABELS.IN_COURSE_BADGE}
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            {LABELS.INTERVIEW_IN_PROGRESS}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 mb-4">
            {MESSAGES.INTERVIEW_ACTIVE_DESC}
          </p>
          <Button
            className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-500 text-white font-semibold"
            onClick={() => onStartInterview(application)}
          >
            <PauseCircle className="mr-2 h-5 w-5" />
            {BUTTONS.CONTINUE_INTERVIEW}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 4. Pending (Default) -> "A la espera de invitación"
  console.log(
    `[${new Date().toISOString()}] [ApplicationCard] Rendering PENDING branch`
  );
  return (
    <Card className="glass-effect border-slate-700/80 relative">
      <div className="absolute top-0 right-0 p-2">
        <Badge variant="outline" className="border-slate-600 text-slate-500">
          {LABELS.PENDING_BADGE}
        </Badge>
      </div>
      <CardHeader>
        <CardTitle className="text-slate-400 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          {TITLES.WAITING_INVITATION}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500">{MESSAGES.WAITING_DESC}</p>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
