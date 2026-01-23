import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  MessageSquare,
  Zap,
  BarChart2,
  BrainCircuit,
  Star
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import SentimentIndicator from "./SentimentIndicator";
import CandidateComparison from "./CandidateComparison";
import { useToast } from "@/components/ui/use-toast";

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  progress?: number;
}

const MetricItem: React.FC<MetricItemProps> = ({
  icon,
  label,
  value,
  unit = "",
  progress
}) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-none">
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-slate-300">{label}</span>
    </div>
    <div className="text-right">
      <span className="font-bold text-lg text-white">
        {value}
        {unit}
      </span>
      {progress !== undefined && (
        <Progress value={progress} className="h-1.5 w-24 mt-1" />
      )}
    </div>
  </div>
);

interface TranscriptEntry {
  timestamp: string;
  text: string;
}

interface TranscriptionViewerProps {
  transcript?: TranscriptEntry[];
}

const TranscriptionViewer: React.FC<TranscriptionViewerProps> = ({
  transcript
}) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-cyan-400">
      Transcripción de la Entrevista
    </h3>
    <div className="h-64 overflow-y-auto p-4 space-y-4 bg-slate-800/50 rounded-lg border border-slate-700">
      {transcript && transcript.length > 0 ? (
        transcript.map((entry, index) => (
          <div key={index} className="flex gap-3">
            <span className="font-mono text-sm text-cyan-400 mt-0.5">
              {entry.timestamp}
            </span>
            <p className="text-slate-200 flex-1">{entry.text}</p>
          </div>
        ))
      ) : (
        <p className="text-slate-400">No hay transcripción disponible.</p>
      )}
    </div>
  </div>
);

interface PerformanceReportProps {
  report: any; // Ideally typed further
  videoUrl?: string;
  transcript?: TranscriptEntry[];
}

const PerformanceReport: React.FC<PerformanceReportProps> = ({
  report,
  videoUrl,
  transcript
}) => {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: "🚧 Función no implementada",
      description: "La descarga de PDF estará disponible próximamente."
    });
  };

  if (!report) {
    return (
      <Card className="w-full max-w-3xl mx-auto bg-slate-900/60 border-slate-700 text-white">
        <CardHeader>
          <CardTitle>Informe no disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No se pudo generar el informe de rendimiento.</p>
        </CardContent>
      </Card>
    );
  }

  const overallScore = Math.round(
    (report.answerQuality +
      report.engagementLevel +
      report.communicationClarity +
      report.technicalProficiency) /
      4
  );

  return (
    <Card className="w-full max-w-5xl mx-auto bg-slate-900/80 backdrop-blur-sm border-slate-700 text-white shadow-2xl">
      <CardHeader className="text-center border-b border-slate-700 pb-4">
        <CardTitle className="text-3xl font-bold gradient-text">
          Informe de Rendimiento
        </CardTitle>
        <CardDescription className="text-slate-400">
          Análisis detallado de la sesión de entrevista.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-semibold text-cyan-400">
              Métricas Clave
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <MetricItem
                icon={<Star size={20} className="text-amber-400" />}
                label="Calidad de Respuesta"
                value={report.answerQuality}
                progress={report.answerQuality}
              />
              <MetricItem
                icon={<BarChart2 size={20} className="text-purple-400" />}
                label="Engagement"
                value={report.engagementLevel}
                progress={report.engagementLevel}
              />
              <MetricItem
                icon={<MessageSquare size={20} className="text-blue-400" />}
                label="Claridad"
                value={report.communicationClarity}
                progress={report.communicationClarity}
              />
              <MetricItem
                icon={<BrainCircuit size={20} className="text-fuchsia-400" />}
                label="Competencia Técnica"
                value={report.technicalProficiency}
                progress={report.technicalProficiency}
              />
              <MetricItem
                icon={<Zap size={20} className="text-yellow-400" />}
                label="Tiempo de Resp."
                value={report.responseTime}
                unit="s"
              />
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <SentimentIndicator sentiment={report.overallSentiment} />
                  <span className="text-slate-300">Sentimiento General</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <h3 className="font-semibold text-slate-300 mb-2">
                Puntuación General
              </h3>
              <p className="text-6xl font-bold text-cyan-400">{overallScore}</p>
              <p className="text-slate-400">sobre 100</p>
            </div>
            {videoUrl && (
              <div>
                <h3 className="font-semibold text-slate-300 mb-3 text-center">
                  Grabación
                </h3>
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg border border-slate-700"
                ></video>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700">
          <TranscriptionViewer transcript={transcript} />
        </div>

        <CandidateComparison report={report} />

        <div className="text-center mt-10">
          <Button
            onClick={handleDownload}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
          >
            <Download size={18} className="mr-2" />
            Descargar Informe (PDF)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceReport;
