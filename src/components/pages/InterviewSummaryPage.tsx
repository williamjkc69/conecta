import React from "react";
import { motion } from "framer-motion";
import PerformanceReport from "@/components/interview/PerformanceReport";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BUTTONS } from "@/constants/text";

interface InterviewSummaryPageProps {
  reportData: any;
  onNavigate: (page: string) => void;
  user: any;
}

const InterviewSummaryPage: React.FC<InterviewSummaryPageProps> = ({
  reportData,
  onNavigate,
  user
}) => {
  const handleBackToDashboard = () => {
    const targetPage =
      user?.user_metadata?.type === "company"
        ? "company-dashboard"
        : "candidate-dashboard";
    onNavigate(targetPage);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <PerformanceReport
          report={reportData.report}
          videoUrl={reportData.videoUrl}
          transcript={reportData.transcript}
        />
      </motion.div>
      <Button
        onClick={handleBackToDashboard}
        variant="outline"
        className="mt-8 bg-transparent border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white"
      >
        <ArrowLeft size={16} className="mr-2" />
        {BUTTONS.BACK_DASHBOARD}
      </Button>
    </div>
  );
};

export default InterviewSummaryPage;
