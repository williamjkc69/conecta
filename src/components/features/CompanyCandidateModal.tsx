import React, { useState } from "react";
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
  MessageSquare
} from "lucide-react";

interface CompanyCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any; // Application object
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

  if (!candidate) return null;

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
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-700 text-slate-100 p-0 overflow-hidden">
          <div className="bg-slate-800/50 p-6 border-b border-slate-700 backdrop-blur-sm">
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

          <ScrollArea className="max-h-[70vh] p-6">
            <div className="space-y-6">
              {/* Interview Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs uppercase font-semibold">
                      Duración
                    </span>
                  </div>
                  <p className="text-lg font-mono text-white">
                    {candidate.interview_duration
                      ? `${Math.floor(candidate.interview_duration / 60)}m ${candidate.interview_duration % 60}s`
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
                    {candidate.messages_count || 0} mensajes
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Award className="w-4 h-4" />
                    <span className="text-xs uppercase font-semibold">
                      Puntaje IA
                    </span>
                  </div>
                  <p className="text-lg font-bold text-cyan-400">
                    {candidate.ai_score
                      ? `${candidate.ai_score}/10`
                      : "Pendiente"}
                  </p>
                </div>
              </div>

              {/* Analysis / Feedback Mock */}
              <div className="bg-slate-800/30 p-5 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-500" />
                  Resumen de la Entrevista
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {candidate.ai_summary ||
                    "El análisis de la entrevista se está generando. Una vez completado, verás aquí un resumen detallado de las respuestas del candidato, sus fortalezas y áreas de mejora identificadas por el agente."}
                </p>
              </div>

              {/* Transcript Placeholder */}
              <div className="bg-slate-800/30 p-5 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-lg mb-3">Transcripción</h3>
                {candidate.transcript ? (
                  <div className="whitespace-pre-line text-sm text-slate-300 font-mono bg-slate-900 p-4 rounded border border-slate-800">
                    {candidate.transcript}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 italic">
                    No hay transcripción disponible aún.
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-900 border-t border-slate-800 gap-3">
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
                >
                  Rechazar
                </Button>
                <Button
                  onClick={() => setShowConfirmApprove(true)}
                  className="bg-green-600 hover:bg-green-500 text-white"
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
