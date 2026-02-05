import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Edit,
  Trash2,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onEdit: () => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  isOpen,
  onClose,
  job,
  onEdit,
  onDelete,
  isDeleting = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!job) return null;

  const handleDelete = () => {
    onDelete(job.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative glass-effect rounded-2xl border border-blue-400/20 w-full max-w-3xl max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex-shrink-0 p-6 pb-4 border-b border-blue-400/10">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors z-10"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="pr-10">
                  <h2 className="text-3xl font-bold gradient-text mb-3">
                    {job.title}
                  </h2>

                  <div className="flex flex-wrap gap-3 text-sm">
                    {job.location && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>{job.location}</span>
                      </div>
                    )}

                    {job.type && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Briefcase className="w-4 h-4 text-cyan-400" />
                        <span>{job.type}</span>
                      </div>
                    )}

                    {job.salary && job.salary !== "-" && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span>{job.salary}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          job.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {job.status === "active" ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">
                    Descripción
                  </h3>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Requirements/Skills */}
                {job.requirements && job.requirements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-3">
                      Requisitos
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-sm text-slate-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Questions */}
                {job.questions && job.questions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-3">
                      Preguntas para la IA
                    </h3>
                    <ul className="space-y-2">
                      {job.questions.map((question: string, index: number) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-slate-300"
                        >
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Applicants Info */}
                {job.applicants !== undefined && (
                  <div className="pt-4 border-t border-blue-400/10">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">
                        {job.applicants}{" "}
                        {job.applicants === 1 ? "aplicante" : "aplicantes"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-6 pt-4 border-t border-blue-400/10 bg-slate-900/50">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-slate-100/20 text-slate-100 hover:bg-slate-100/10"
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={onEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-slate-800 rounded-xl p-6 max-w-md w-full border border-red-500/20"
          >
            <h3 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Trash2 className="text-red-500" />
              ¿Eliminar vacante?
            </h3>
            <p className="text-slate-300 mb-6">
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              vacante y todas las aplicaciones asociadas.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Sí, eliminar"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default JobDetailsModal;
