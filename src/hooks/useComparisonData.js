import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// This is a mock-up. A real implementation would query based on the actual job ID.
const MOCK_JOB_ID = 'e9e0a749-9544-4466-8d9d-35a68470b911'; 

export const useComparisonData = (currentCandidateReport) => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all applications for a specific job. In a real app, this job_id
        // would be passed as a prop.
        const { data: applications, error: fetchError } = await supabase
          .from('applications')
          .select('id, candidate_id, interview_data')
          .eq('job_id', MOCK_JOB_ID)
          .neq('interview_data', null);

        if (fetchError) throw fetchError;

        // Filter out entries without a valid report
        const validReports = applications
          .map(app => app.interview_data?.report)
          .filter(report => report && typeof report.answerQuality === 'number');

        if (validReports.length === 0) {
          setComparisonData({
            averageMetrics: {},
            leaderboard: [],
            percentile: {},
            totalCompared: 0
          });
          return;
        }

        const metrics = ['answerQuality', 'engagementLevel', 'communicationClarity', 'technicalProficiency'];
        const averageMetrics = metrics.reduce((acc, metric) => {
          const total = validReports.reduce((sum, report) => sum + (report[metric] || 0), 0);
          acc[metric] = Math.round(total / validReports.length);
          return acc;
        }, {});

        const leaderboard = validReports.map((report, index) => {
          const overallScore = Math.round(metrics.reduce((sum, metric) => sum + (report[metric] || 0), 0) / metrics.length);
          return {
            id: applications[index].candidate_id || `candidate-${index}`,
            name: `Candidato ${index + 1}`, // In real app, fetch profile name
            score: overallScore,
          };
        }).sort((a, b) => b.score - a.score);

        const percentile = currentCandidateReport ? metrics.reduce((acc, metric) => {
          const candidateScore = currentCandidateReport[metric];
          const scoresBelow = validReports.filter(report => report[metric] < candidateScore).length;
          acc[metric] = Math.round((scoresBelow / validReports.length) * 100);
          return acc;
        }, {}) : {};
        
        setComparisonData({
          averageMetrics,
          leaderboard: leaderboard.slice(0, 5), // Top 5
          percentile,
          totalCompared: validReports.length,
        });

      } catch (err) {
        console.error("Error fetching comparison data:", err);
        setError("No se pudieron cargar los datos de comparación.");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [currentCandidateReport]);

  return { comparisonData, loading, error };
};