import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  User,
  Mail,
  Award,
  MessageSquare,
  Play,
  Pause,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CompanyCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any; // Basic Application object passed from list
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const CompanyCandidateModal: React.FC<CompanyCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onApprove,
  onReject
}) => {
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Detailed Data State
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Transcript State
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (isOpen && candidate?.id) {
      fetchCandidateDetails();
    } else {
      // Reset state when closed
      setDetails(null);
      setResponses([]);
      setReport(null);
      setIsPlaying(false);
      setShowTranscript(false);
    }
  }, [isOpen, candidate?.id]);

  const fetchCandidateDetails = async () => {
    setLoadingDetails(true);
    try {
      // 1. Fetch Application Details (fresh data)
      const { data: appData, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", candidate.id)
        .single();

      if (appError) throw appError;
      setDetails(appData);

      // 2. Fetch Interview Responses
      const { data: respData, error: respError } = await supabase
        .from("interview_responses")
        .select("*")
        .eq("application_id", candidate.id)
        .order("id", { ascending: true });

      if (!respError) setResponses(respData || []);

      // 3. Fetch Report (Analysis)
      const { data: repData, error: repError } = await supabase
        .from("reports")
        .select("json_data")
        .eq("application_id", candidate.id)
        .single();

      if (!repError && repData) setReport(repData.json_data);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    await onApprove(candidate.id);
    setProcessing(false);
    setShowConfirmApprove(false);
    onClose();
  };

  const handleReject = async () => {
    setProcessing(true);
    await onReject(candidate.id);
    setProcessing(false);
    setShowConfirmReject(false);
    onClose();
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const changeSpeed = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
  };

  if (!candidate) return null;

  const displayData = details || candidate; // Fallback to prop data if details loading/failed (though details has more fields)
  // Prioritize details for score/feedback as they might be updated
  const score = details?.technical_competency_score ?? candidate.ai_score;
  const summary = details?.feedback ?? candidate.ai_summary;
  const decision = details?.interview_decision;
  const recordingUrl = details?.recording_url;
  const transcriptText =
    report?.transcript || details?.transcript || candidate.transcript;

  const statusColors: any = {
    invited: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    interviewing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    completed: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  const statusLabels: any = {
    invited: "Invitado",
    interviewing: "En Entrevista",
    completed: "En Revisión",
    approved: "Aprobado",
    rejected: "Rechazado"
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-slate-100 p-0 overflow-hidden h-[85vh] flex flex-col">
          {/* Header */}
          <div className="bg-slate-800/50 p-6 border-b border-slate-700 backdrop-blur-sm flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  {candidate.candidateName || "Candidato"}
                  <Badge
                    variant="outline"
                    className={statusColors[candidate.status] || ""}
                  >
                    {statusLabels[candidate.status] || candidate.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {candidate.candidateEmail}
                </DialogDescription>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-300">Vacante</p>
                <p className="text-cyan-400 font-medium">
                  {candidate.jobTitle || "Desconocido"}
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 p-6">
            {loadingDetails && !details ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* KPI Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">
                        Duración
                      </span>
                    </div>
                    <p className="text-lg font-mono text-white">
                      {displayData.interview_duration
                        ? `${Math.floor(displayData.interview_duration / 60)}m ${displayData.interview_duration % 60}s`
                        : "--:--"}
                    </p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">
                        Interacción
                      </span>
                    </div>
                    <p className="text-lg text-white">
                      {candidate.messages_count || responses.length > 0
                        ? responses.length > 0
                          ? `${responses.length} respuestas`
                          : `${candidate.messages_count} mensajes`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Award className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">
                        Puntaje Técnico
                      </span>
                    </div>
                    <p
                      className={`text-lg font-bold ${score >= 7 ? "text-green-400" : score >= 5 ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {typeof score === "number" ? `${score}/10` : "Pendiente"}
                    </p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">
                        Decisión IA
                      </span>
                    </div>
                    <p className="text-lg text-white capitalize">
                      {decision || "Pendiente"}
                    </p>
                  </div>
                </div>

                {/* Audio Player */}
                {recordingUrl && (
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                      Grabación de Entrevista
                    </h3>
                    <div className="flex flex-col gap-4">
                      {/* Native Audio Player with Controls */}
                      <audio
                        ref={audioRef}
                        src={recordingUrl}
                        controls
                        className="w-full h-10 rounded"
                        onEnded={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      <div className="flex gap-2 justify-end items-center">
                        <span className="text-xs text-slate-400">
                          Velocidad:
                        </span>
                        {[1.0, 1.25, 1.5, 2.0].map((rate) => (
                          <Button
                            key={rate}
                            size="sm"
                            variant={
                              playbackRate === rate ? "secondary" : "ghost"
                            }
                            onClick={() => changeSpeed(rate)}
                            className={`text-xs h-7 px-2 ${playbackRate === rate ? "bg-cyan-900/50 text-cyan-300 border border-cyan-700" : "text-slate-400"}`}
                          >
                            {rate}x
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback / Summary */}
                {summary && (
                  <div className="bg-slate-800/30 p-5 rounded-lg border border-slate-700">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-500" />
                      Feedback General
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      {summary}
                    </p>
                  </div>
                )}

                {/* Interview Responses */}
                {responses && responses.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-400" />
                      Desglose de Preguntas
                    </h3>
                    <div className="grid gap-4">
                      {responses.map((resp: any, i: number) => (
                        <div
                          key={resp.id || i}
                          className="bg-slate-800/40 border border-slate-700 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <h4 className="font-medium text-slate-200 text-sm">
                              {resp.question_text}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`
                                                ${resp.quality === "Excellent" || resp.quality === "Good" ? "border-green-500/30 text-green-400 bg-green-500/10" : ""}
                                                ${resp.quality === "Fair" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" : ""}
                                                ${resp.quality === "Poor" ? "border-red-500/30 text-red-400 bg-red-500/10" : ""}
                                            `}
                            >
                              {resp.quality || "N/A"}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded">
                            {resp.response}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Analysis (Strengths/Weaknesses) */}
                {report?.overall_assessment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                      <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Fortalezas
                      </h4>
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {report.overall_assessment.strengths?.map(
                          (point: string, idx: number) => (
                            <li key={idx}>{point}</li>
                          )
                        ) || (
                          <li className="italic text-slate-500">
                            No registradas
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                      <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Áreas de Mejora
                      </h4>
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {report.overall_assessment.weaknesses?.map(
                          (point: string, idx: number) => (
                            <li key={idx}>{point}</li>
                          )
                        ) || (
                          <li className="italic text-slate-500">
                            No registradas
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Communication & Next Steps */}
                {report && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                      <h4 className="font-semibold text-slate-200 mb-2 text-sm">
                        Calidad de Comunicación
                      </h4>
                      <p className="text-slate-400 text-sm">
                        {report.overall_assessment?.communication_quality ||
                          "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                      <h4 className="font-semibold text-slate-200 mb-2 text-sm">
                        Siguientes Pasos Sugeridos
                      </h4>
                      <p className="text-slate-400 text-sm">
                        {report.recommendation?.suggested_next_steps || "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Collapsible Transcript */}
                <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden mb-8">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors"
                  >
                    <h3 className="font-semibold text-lg">
                      Transcripción Completa
                    </h3>
                    {showTranscript ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {showTranscript && (
                    <div className="p-5 pt-0 border-t border-slate-700/50 pb-8">
                      {transcriptText ? (
                        <div className="mt-4 max-h-[500px] overflow-y-auto pr-2 pb-4">
                          {Array.isArray(transcriptText) ? (
                            <div className="space-y-4">
                              {transcriptText.map((turn: any, i: number) => (
                                <div
                                  key={i}
                                  className={`flex flex-col ${turn.role === "agent" ? "items-end" : "items-start"}`}
                                >
                                  <div
                                    className={`max-w-[85%] rounded-lg p-3 text-sm ${turn.role === "agent" ? "bg-cyan-950/40 text-cyan-100 border border-cyan-900/30" : "bg-slate-800 text-slate-200 border border-slate-700"}`}
                                  >
                                    <span className="text-[10px] font-bold opacity-60 uppercase mb-1 block tracking-wider">
                                      {turn.role === "agent"
                                        ? "Entrevistador (IA)"
                                        : "Candidato"}
                                    </span>
                                    {turn.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="whitespace-pre-line text-xs text-slate-400 font-mono bg-slate-900 p-4 rounded border border-slate-800">
                              {transcriptText}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 italic">
                          No hay transcripción disponible aún.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className="p-6 bg-slate-900 border-t border-slate-800 gap-3 flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>

            {/* Only show decision buttons if status is 'completed' (waiting for review) */}
            {(candidate.status === "completed" ||
              candidate.status === "reviewed") && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirmReject(true)}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/50"
                  disabled={processing}
                >
                  Rechazar
                </Button>
                <Button
                  onClick={() => setShowConfirmApprove(true)}
                  className="bg-green-600 hover:bg-green-500 text-white"
                  disabled={processing}
                >
                  Aprobar Contratación
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <AlertDialog
        open={showConfirmApprove}
        onOpenChange={setShowConfirmApprove}
      >
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar candidato?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Estás a punto de marcar a{" "}
              <strong>{candidate.candidateName}</strong> como aprobado. Esto
              notificará al candidato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 text-white hover:bg-green-500"
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar Aprobación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation */}
      <AlertDialog open={showConfirmReject} onOpenChange={setShowConfirmReject}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              ¿Rechazar candidato?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Estás a punto de rechazar la aplicación de{" "}
              <strong>{candidate.candidateName}</strong>. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 text-white hover:bg-red-500"
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar Rechazo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompanyCandidateModal;
