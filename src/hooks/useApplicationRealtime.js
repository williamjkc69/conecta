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
          .select(`
            *,
            listing:listings (
              id,
              title,
              description,
              location,
              company:companies(id, name)
            ),
            status:application_statuses(name)
          `)
          .eq('id', applicationId)
          .single();

        if (error) throw error;
        
        if (isMounted) {
          // Transform data to match expected format
          const statusName = Array.isArray(data.status) 
            ? data.status[0]?.name 
            : data.status?.name;
          
          // Derive interview_status from status
          let interviewStatus = "pending";
          if (statusName === "completed") {
            interviewStatus = "completed";
          } else if (statusName === "invited") {
            interviewStatus = "invited";
          } else if (statusName === "interviewing") {
            interviewStatus = "in_progress";
          } else if (data.call_id) {
            interviewStatus = "in_progress";
          }

          const transformedData = {
            ...data,
            status: statusName || "pending",
            interview_status: interviewStatus,
            // Add backward compatibility fields
            jobs: data.listing ? {
              title: data.listing.title,
              description: data.listing.description,
              location: data.listing.location,
              company: data.listing.company
            } : null
          };

          setApplication(transformedData);
          setError(null);
          console.log(`[${new Date().toISOString()}] [useApplicationRealtime] Initial data loaded. Status: ${interviewStatus}`);
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
            console.log(`[${new Date().toISOString()}] [useApplicationRealtime] Update received:`, payload.new);
            
            setApplication((prev) => {
              if (!prev) return null;
              // Preserve the listing/jobs relation when merging updates
              // Realtime updates don't include relations, so we need to keep them
              return { 
                ...prev, 
                ...payload.new,
                listing: prev.listing, // Explicitly preserve listing relation
                jobs: prev.jobs // Explicitly preserve backward compat jobs
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