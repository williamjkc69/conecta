import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useJobDetails = (jobId) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      console.log(`[useJobDetails] Fetching job details for job ID: ${jobId}`);

      const { data, error } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('[useJobDetails] Error fetching job details:', error);
        setError(error);
        setJob(null);
      } else {
        console.log('[useJobDetails] Successfully fetched job details:', data);
        setJob(data);
      }

      setLoading(false);
    };

    fetchJobDetails();
  }, [jobId]);

  return { job, loading, error };
};