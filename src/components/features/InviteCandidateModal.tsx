import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, UserPlus, Briefcase } from "lucide-react";

interface InviteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onInviteSent?: () => void;
  candidate?: any;
  job?: any;
  jobs?: any[];
}

const InviteCandidateModal: React.FC<InviteCandidateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onInviteSent,
  candidate: initialCandidate,
  job: initialJob,
  jobs: externalJobs
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>(externalJobs || []);
  const [selectedJobId, setSelectedJobId] = useState(initialJob?.id || "");
  const [emailSearch, setEmailSearch] = useState("");
  const [foundCandidate, setFoundCandidate] = useState<any>(
    initialCandidate || null
  );
  const [searching, setSearching] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchJobs();
      if (initialCandidate) {
        setFoundCandidate(initialCandidate);
        setEmailSearch(initialCandidate.email);
      } else {
        setFoundCandidate(null);
        setEmailSearch("");
      }
      if (initialJob) {
        setSelectedJobId(initialJob.id);
      }
    }
  }, [isOpen, initialCandidate, initialJob]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, title, company_id, companies:profiles!jobs_company_id_fkey(company_name)"
        )
        .eq("status", "active");

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las vacantes disponibles."
      });
    }
  };

  const searchCandidate = async () => {
    if (!emailSearch.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", emailSearch.trim())
        .eq("role", "candidate")
        .single();

      if (error) {
        setFoundCandidate(null);
        toast({
          variant: "destructive",
          title: "No encontrado",
          description: "No se encontró un candidato con ese correo electrónico."
        });
      } else {
        setFoundCandidate(data);
        toast({
          title: "Candidato encontrado",
          description: `${data.full_name} está disponible para invitación.`
        });
      }
    } catch (error) {
      console.error("Error searching candidate:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!foundCandidate || !selectedJobId) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Debes seleccionar un candidato y una vacante."
      });
      return;
    }

    const selectedJob = jobs.find((j) => j.id === selectedJobId);
    if (!selectedJob) return;

    setLoading(true);
    console.log(
      `[InviteCandidateModal] Inviting ${foundCandidate.email} to job ${selectedJob.title}`
    );

    try {
      // 1) Verify when admin invites candidate, Supabase function sets interview_status = "invited"
      const { data, error } = await supabase.rpc("assign_candidate_to_job", {
        p_candidate_id: foundCandidate.id,
        p_job_id: selectedJobId,
        p_company_id: selectedJob.company_id
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // 5) Add logging to show when invitation is sent and what interview_status is set to
      console.log("[InviteCandidateModal] Invitation successful:", data);
      console.log("[InviteCandidateModal] Interview Status set to: invited");

      toast({
        title: "Invitación enviada",
        description:
          "El candidato ha sido invitado exitosamente. El estado es ahora 'Invitado'."
      });

      // 2) Ensure onSuccess callback is called after successful invitation
      if (onSuccess) {
        onSuccess();
      }
      if (onInviteSent) {
        onInviteSent();
      }
      onClose();
    } catch (error: any) {
      // 6) Verify error handling if invitation fails
      console.error("[InviteCandidateModal] Invitation failed:", error);
      toast({
        variant: "destructive",
        title: "Error al invitar",
        description:
          error.message || "Hubo un problema al procesar la invitación."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            Invitar Candidato
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Asigna una vacante a un candidato para iniciar el proceso de
            entrevista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label className="text-slate-200">Candidato</Label>
            {initialCandidate ? (
              <div className="p-3 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">
                    {initialCandidate.full_name}
                  </p>
                  <p className="text-sm text-slate-400">
                    {initialCandidate.email}
                  </p>
                </div>
                <div className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded border border-green-900/50">
                  Seleccionado
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por email..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  onKeyDown={(e) => e.key === "Enter" && searchCandidate()}
                />
                <Button
                  onClick={searchCandidate}
                  disabled={searching}
                  variant="secondary"
                  className="shrink-0"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
            {!initialCandidate && foundCandidate && (
              <div className="mt-2 p-2 bg-green-900/20 border border-green-900/50 rounded text-sm text-green-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Encontrado: {foundCandidate.full_name}
              </div>
            )}
          </div>

          {/* Job Selection */}
          <div className="space-y-2">
            <Label className="text-slate-200">Vacante</Label>
            <Select
              value={selectedJobId}
              onValueChange={setSelectedJobId}
              disabled={!!initialJob}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="Seleccionar vacante" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}{" "}
                    <span className="text-slate-500 text-xs">
                      ({job.companies?.company_name})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleInvite}
            disabled={loading || !foundCandidate || !selectedJobId}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Invitando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Enviar Invitación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCandidateModal;
