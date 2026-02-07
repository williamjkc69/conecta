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
          .in('status_id', [1, 6, 2]) // Allow Invited (1), Interviewing (6), Completed (2)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
             // PGRST116 is "The result contains 0 rows"
             throw new Error("Application not found or access denied (Status not Invited/Interviewing/Completed)");
          }
          throw error;
        }
        
        if (isMounted) {
          // Helper to derive status strings from ID
          const deriveStatus = (statusId) => {
             if (statusId === 1) return { status: 'invited', interview_status: 'invited' };
             if (statusId === 6) return { status: 'interviewing', interview_status: 'in_progress' };
             if (statusId === 2) return { status: 'completed', interview_status: 'completed' };
             return { status: 'pending', interview_status: 'pending' };
          };

          const { status, interview_status } = deriveStatus(data.status_id);

          const transformedData = {
            ...data,
            status,
            interview_status,
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
          console.log(`[${new Date().toISOString()}] [useApplicationRealtime] Initial data loaded. StatusId: ${data.status_id} -> ${interview_status}`);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] [useApplicationRealtime] Error:`, err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApplication();

    // Try to set up realtime subscription
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
              
              const deriveStatus = (statusId) => {
                 if (statusId === 1) return { status: 'invited', interview_status: 'invited' };
                 if (statusId === 6) return { status: 'interviewing', interview_status: 'in_progress' };
                 if (statusId === 2) return { status: 'completed', interview_status: 'completed' };
                 return { status: 'pending', interview_status: 'pending' };
              };

              const { status, interview_status } = deriveStatus(payload.new.status_id);

              return { 
                ...prev, 
                ...payload.new,
                status,
                interview_status,
                listing: prev.listing, 
                jobs: prev.jobs 
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