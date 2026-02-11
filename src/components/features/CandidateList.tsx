import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Eye,
  Users,
  Send,
  Check,
  Clock,
  X,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { BUTTONS, TITLES, MESSAGES, LABELS } from "@/constants/text";
import { CANDIDATE_STATUS_LABELS } from "@/constants/options";
import { CANDIDATE_STATUS } from "@/constants/status";

interface StatusConfigItem {
  icon: ReactNode;
  text: string;
  color: string;
}

const statusConfig: Record<string, StatusConfigItem> = {
  [CANDIDATE_STATUS.APPLIED]: {
    icon: <Clock className="w-4 h-4" />,
    text: CANDIDATE_STATUS_LABELS.applied,
    color: "bg-yellow-500/20 text-yellow-400"
  },
  [CANDIDATE_STATUS.INVITED]: {
    icon: <Send className="w-4 h-4" />,
    text: CANDIDATE_STATUS_LABELS.invited,
    color: "bg-blue-500/20 text-blue-300"
  },
  [CANDIDATE_STATUS.INTERVIEWING]: {
    icon: <Briefcase className="w-4 h-4" />,
    text: CANDIDATE_STATUS_LABELS.interviewing,
    color: "bg-purple-500/20 text-purple-300"
  },
  [CANDIDATE_STATUS.COMPLETED]: {
    icon: <Clock className="w-4 h-4" />,
    text: LABELS.IN_REVIEW,
    color: "bg-orange-500/20 text-orange-400"
  },
  [CANDIDATE_STATUS.APPROVED]: {
    icon: <Check className="w-4 h-4" />,
    text: CANDIDATE_STATUS_LABELS.hired,
    color: "bg-green-500/20 text-green-400"
  },
  [CANDIDATE_STATUS.REJECTED]: {
    icon: <X className="w-4 h-4" />,
    text: CANDIDATE_STATUS_LABELS.rejected,
    color: "bg-red-500/20 text-red-400"
  },
  [CANDIDATE_STATUS.PENDING]: {
    icon: <Clock className="w-4 h-4" />,
    text: LABELS.PENDING_BADGE,
    color: "bg-gray-500/20 text-gray-400"
  },
  [CANDIDATE_STATUS.EXPIRED]: {
    icon: <Clock className="w-4 h-4" />,
    text: LABELS.EXPIRED,
    color: "bg-red-500/20 text-red-400"
  }
};

interface Candidate {
  id: string; // application id
  status: string;
  candidateName: string;
  candidateEmail: string;
  appliedAt: string;
  job_id: string;
}

interface Job {
  id: string;
  title: string;
}

interface CandidateListProps {
  candidates: Candidate[];
  jobs: Job[];
  onViewCandidate?: (candidate: Candidate) => void;
}

const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  jobs,
  onViewCandidate
}) => {
  const { toast } = useToast();

  const getJobTitle = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    return job ? job.title : MESSAGES.JOB_NOT_FOUND;
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">{MESSAGES.NO_CANDIDATES}</p>
        <p className="text-sm text-slate-500">{MESSAGES.NO_CANDIDATES_DESC}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {candidates.map((candidate, index) => {
        const statusInfo = statusConfig[candidate.status] || {
          icon: <User className="w-4 h-4" />,
          text: candidate.status,
          color: "bg-gray-500/20 text-gray-400"
        };

        // Show view button for completed, approved, rejected
        const showViewButton = (
          [
            CANDIDATE_STATUS.COMPLETED,
            CANDIDATE_STATUS.APPROVED,
            CANDIDATE_STATUS.REJECTED
          ] as string[]
        ).includes(candidate.status);

        return (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() =>
              showViewButton && onViewCandidate && onViewCandidate(candidate)
            }
            className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 transition-all ${showViewButton ? "hover:border-cyan-500/50 cursor-pointer" : ""}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                    {candidate.candidateName?.charAt(0).toUpperCase() || "C"}
                  </div>

                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-1 text-slate-100">
                      {candidate.candidateName}
                    </h4>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {candidate.candidateEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(candidate.appliedAt).toLocaleDateString(
                          LABELS.LOCALE_ES
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-slate-400">{LABELS.JOB}:</span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {getJobTitle(candidate.job_id)}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
                  >
                    {statusInfo.icon}
                    {statusInfo.text}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {candidate.status === CANDIDATE_STATUS.INVITED && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast({
                        title: TITLES.NOT_IMPLEMENTED,
                        description: MESSAGES.RESEND_FEATURE_DESC
                      });
                    }}
                    variant="outline"
                    className="border-blue-500/50 text-cyan-400 hover:bg-blue-500/10"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {BUTTONS.RESEND}
                  </Button>
                )}
                {showViewButton && (
                  <Button
                    onClick={() =>
                      onViewCandidate && onViewCandidate(candidate)
                    }
                    variant="outline"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {BUTTONS.VIEW_DETAILS}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CandidateList;
