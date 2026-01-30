import React from "react";
import { useComparisonData } from "@/hooks/useComparisonData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Loader2, AlertTriangle, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaderboardCandidate {
  id: string;
  name: string;
  score: number;
}

interface CandidateLeaderboardProps {
  leaderboard: LeaderboardCandidate[];
}

const CandidateLeaderboard: React.FC<CandidateLeaderboardProps> = ({
  leaderboard
}) => (
  <div className="space-y-3">
    <h4 className="flex items-center gap-2 text-md font-semibold text-slate-300">
      <Trophy size={18} className="text-yellow-400" />
      Top 5 Postulantes
    </h4>
    <ul className="space-y-2">
      {leaderboard.map((candidate, index) => (
        <li
          key={candidate.id}
          className="flex items-center justify-between p-2 rounded-md bg-slate-800/50"
        >
          <div className="flex items-center gap-3">
            <span
              className={`font-bold text-lg ${index < 3 ? `text-yellow-${4 - index}00` : "text-slate-400"}`}
            >
              {index + 1}
            </span>
            <span className="text-slate-300">{candidate.name}</span>
          </div>
          <span className="font-bold text-cyan-400">{candidate.score} pts</span>
        </li>
      ))}
    </ul>
  </div>
);

interface CandidateComparisonProps {
  report: any; // Ideally typed further
}

const CandidateComparison: React.FC<CandidateComparisonProps> = ({
  report
}) => {
  const { comparisonData, loading, error } = useComparisonData(report);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-cyan-400" />
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-64 text-red-400">
        <AlertTriangle className="mr-2" />
        {error}
      </div>
    );
  if (!comparisonData || comparisonData.totalCompared === 0) return null;

  const { averageMetrics, leaderboard, percentile, totalCompared } =
    comparisonData;

  const chartData = [
    {
      name: "Calidad Resp.",
      Candidato: report.answerQuality,
      Promedio: averageMetrics.answerQuality
    },
    {
      name: "Engagement",
      Candidato: report.engagementLevel,
      Promedio: averageMetrics.engagementLevel
    },
    {
      name: "Comunicación",
      Candidato: report.communicationClarity,
      Promedio: averageMetrics.communicationClarity
    },
    {
      name: "Técnica",
      Candidato: report.technicalProficiency,
      Promedio: averageMetrics.technicalProficiency
    }
  ];

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-slate-700">
      <h3 className="text-xl font-semibold text-cyan-400 flex items-center gap-2">
        <Users size={22} />
        Análisis Comparativo
        <span className="text-sm font-normal text-slate-400">
          (vs. {totalCompared} postulantes)
        </span>
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="mb-4 text-md font-semibold text-slate-300">
            Comparación de Métricas
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  color: "#cbd5e1"
                }}
                cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
              />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <Bar dataKey="Candidato" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Promedio" fill="#475569" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <CandidateLeaderboard leaderboard={leaderboard} />
      </div>
      {/* Filters - UI only for now */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-slate-400">Filtrar por:</span>
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-800 border-slate-700"
        >
          Posición
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-800 border-slate-700"
        >
          Departamento
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-800 border-slate-700"
        >
          Fecha
        </Button>
      </div>
    </div>
  );
};

export default CandidateComparison;
