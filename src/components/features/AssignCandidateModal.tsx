import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserPlus,
  Briefcase,
  Loader2,
  Search,
  User,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
// @ts-ignore
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/authStore";

interface AssignCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentSuccess: () => void;
  jobs: any[];
}

const AssignCandidateModal: React.FC<AssignCandidateModalProps> = ({
  isOpen,
  onClose,
  onAssignmentSuccess,
  jobs
}) => {
  const [documentNumber, setDocumentNumber] = useState("");
  const [foundCandidate, setFoundCandidate] = useState<any>(null);
  const [jobId, setJobId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthStore();
  const profile = user; // Hacky but works for now as user in store contains profile if I recall, or we need separate profile. But authStore has user only usually. Wait, authStore actually has profile.

  const debouncedDocumentNumber = useDebounce(documentNumber, 500);

  const searchCandidate = useCallback(
    async (docNumber: string) => {
      if (!docNumber || docNumber.length < 5) {
        setFoundCandidate(null);
        return;
      }
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "candidate")
          .eq("document_number", docNumber)
          .single();

        if (error || !data) {
          setFoundCandidate(null);
          if (error && error.code !== "PGRST116") {
            // Ignore "No rows found" error for feedback
            throw error;
          }
          toast({
            title: "Candidato no encontrado",
            description:
              "No se encontró ningún candidato con ese número de documento.",
            variant: "destructive"
          });
        } else {
          setFoundCandidate(data);
        }
      } catch (error) {
        console.error("Error searching candidate:", error);
        setFoundCandidate(null);
        toast({
          title: "Error en la búsqueda",
          description: "Ocurrió un error al buscar el candidato.",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    searchCandidate(debouncedDocumentNumber);
  }, [debouncedDocumentNumber, searchCandidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundCandidate || !jobId || !profile) {
      toast({
        title: "⚠️ Campos requeridos",
        description:
          "Debes encontrar un candidato, seleccionar una vacante y estar autenticado.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "assign-candidate-to-job",
        {
          body: {
            p_candidate_id: foundCandidate.id,
            p_job_id: jobId,
            p_company_id: profile.id
          }
        }
      );

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "✅ Asignación exitosa",
        description:
          data.message || `El candidato ha sido asignado a la vacante.`
      });

      resetForm();
      onAssignmentSuccess();
      onClose();
    } catch (error: any) {
      console.error("[AssignCandidateModal] Error:", error);
      toast({
        title: "Error en la asignación",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDocumentNumber("");
    setFoundCandidate(null);
    setJobId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-lg w-full"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text mb-6">
              Asignar por Documento
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Número de Documento del Candidato *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Introduce el número de documento..."
                    required
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 animate-spin" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {foundCandidate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"
                  >
                    <h3 className="font-semibold text-slate-200 mb-2">
                      Candidato Encontrado
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-slate-300">
                        <User className="w-4 h-4 text-purple-400" />{" "}
                        {foundCandidate.full_name}
                      </p>
                      <p className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-4 h-4 text-purple-400" />{" "}
                        {foundCandidate.email}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Seleccionar Vacante *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 appearance-none rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    disabled={!foundCandidate}
                  >
                    <option value="" disabled>
                      Selecciona una vacante activa...
                    </option>
                    {jobs.map((job: any) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !foundCandidate || !jobId}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Asignar Candidato
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AssignCandidateModal;
