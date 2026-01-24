import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useApplicationRealtime = (applicationId) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchApplication = async () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [useApplicationRealtime] Fetching application: ${applicationId}`);
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('applications')
          .select('*, jobs(*)')
          .eq('id', applicationId)
          .single();

        if (error) throw error;
        
        if (isMounted) {
          setApplication(data);
          setError(null);
          console.log(`[${new Date().toISOString()}] [useApplicationRealtime] Initial data loaded. Status: ${data.interview_status}`);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] [useApplicationRealtime] Error:`, err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApplication();

    // Try to set up realtime subscription, but don't fail if it doesn't work
    const channel = supabase
      .channel(`application-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `id=eq.${applicationId}`,
        },
        (payload) => {
          if (isMounted) {
            const newStatus = payload.new.interview_status;
            console.log(`[${new Date().toISOString()}] [useApplicationRealtime] Update received. New Interview Status: ${newStatus}`);
            
            setApplication((prev) => {
              if (!prev) return null;
              // Preserve the jobs relation when merging updates
              // Realtime updates don't include relations, so we need to keep them
              return { 
                ...prev, 
                ...payload.new,
                jobs: prev.jobs // Explicitly preserve jobs relation
              };
            });
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[${new Date().toISOString()}] [useApplicationRealtime] Subscribed to updates.`);
        } else if (status === 'CHANNEL_ERROR') {
          console.warn(`[${new Date().toISOString()}] [useApplicationRealtime] Subscription error (non-critical):`, err);
          // Don't set error state - this is not critical for the interview to work
          // The app will work fine with just the initial data fetch
        }
      });

    return () => {
      isMounted = false;
      console.log(`[${new Date().toISOString()}] [useApplicationRealtime] Cleaning up subscription.`);
      supabase.removeChannel(channel);
    };
  }, [applicationId]);

  return { application, loading, error };
};