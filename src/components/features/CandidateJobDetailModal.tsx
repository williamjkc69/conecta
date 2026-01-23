import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailSectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

const DetailSection: React.FC<DetailSectionProps> = ({
  icon,
  title,
  children
}) => (
  <div>
    <h4 className="flex items-center text-lg font-semibold text-slate-300 mb-2">
      {icon}
      <span className="ml-2">{title}</span>
    </h4>
    <div className="pl-8 text-slate-400">{children}</div>
  </div>
);

interface JobApplication {
  companyName?: string;
  jobTitle?: string;
  location?: string;
  salary?: string;
  type?: string;
  description?: string;
  requirements?: string[];
  [key: string]: any;
}

interface CandidateJobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplication;
}

const CandidateJobDetailModal: React.FC<CandidateJobDetailModalProps> = ({
  isOpen,
  onClose,
  application
}) => {
  if (!application) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <header className="mb-8">
              <p className="text-lg font-semibold text-cyan-400 mb-1">
                {application.companyName}
              </p>
              <h2 className="text-3xl font-bold gradient-text">
                {application.jobTitle}
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-slate-400">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {application.location || "No especificado"}
                </span>
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {application.salary || "A convenir"}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {application.type || "No especificado"}
                </span>
              </div>
            </header>

            <div className="space-y-6">
              <DetailSection
                icon={<Briefcase className="w-5 h-5 text-cyan-400" />}
                title="Descripción del Puesto"
              >
                <p className="whitespace-pre-wrap">{application.description}</p>
              </DetailSection>

              <DetailSection
                icon={<ListChecks className="w-5 h-5 text-cyan-400" />}
                title="Requisitos"
              >
                {application.requirements &&
                application.requirements.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {application.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No se especificaron requisitos.</p>
                )}
              </DetailSection>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CandidateJobDetailModal;
