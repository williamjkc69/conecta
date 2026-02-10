import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/constants/supabase';
import { CANDIDATE_STATUS, CANDIDATE_STATUS_IDS, INTERVIEW_STATUS } from '@/constants/status';

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
          .from(TABLES.APPLICATIONS)
          .select(`
            *,
            listing:${TABLES.LISTINGS} (
              *,
              company:${TABLES.COMPANIES}(id, name),
              listing_skills(
                skill:skills(id, name)
              ),
              listing_questions(id, question)
            ),
            status:${TABLES.APPLICATION_STATUSES}(name)
          `)
          .eq('id', applicationId)
          .in('status_id', [
            CANDIDATE_STATUS_IDS.INVITED,
            CANDIDATE_STATUS_IDS.INTERVIEWING,
            CANDIDATE_STATUS_IDS.COMPLETED
          ]) // Allow Invited, Interviewing, Completed
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
             if (statusId === CANDIDATE_STATUS_IDS.INVITED) return { status: CANDIDATE_STATUS.INVITED, interview_status: INTERVIEW_STATUS.INVITED };
             if (statusId === CANDIDATE_STATUS_IDS.INTERVIEWING) return { status: CANDIDATE_STATUS.INTERVIEWING, interview_status: INTERVIEW_STATUS.IN_PROGRESS };
             if (statusId === CANDIDATE_STATUS_IDS.COMPLETED) return { status: CANDIDATE_STATUS.COMPLETED, interview_status: INTERVIEW_STATUS.COMPLETED };
             return { status: CANDIDATE_STATUS.PENDING, interview_status: INTERVIEW_STATUS.PENDING };
          };

          const { status, interview_status } = deriveStatus(data.status_id);
          
          // Map skills from relations or fallback to column
          const skills = data.listing?.listing_skills?.map(ls => ls.skill?.name).filter(Boolean) 
                        || data.listing?.requirements 
                        || data.listing?.skills 
                        || [];
                        
          // Map questions from relations or fallback to column
          const questions = data.listing?.listing_questions?.map(lq => lq.question).filter(Boolean)
                           || data.listing?.questions
                           || [];

          const transformedData = {
            ...data,
            status,
            interview_status,
            // Add backward compatibility fields
            jobs: data.listing ? {
              title: data.listing.title,
              description: data.listing.description,
              location: data.listing.location,
              company: data.listing.company,
              skills: skills,
              requirements: skills, // Map to requirements too for compatibility
              questions: questions
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
          table: TABLES.APPLICATIONS,
          filter: `id=eq.${applicationId}`,
        },
        (payload) => {
          if (isMounted) {
            console.log(`[${new Date().toISOString()}] [useApplicationRealtime] Update received:`, payload.new);
            
            setApplication((prev) => {
              if (!prev) return null;
              
              const deriveStatus = (statusId) => {
                 if (statusId === CANDIDATE_STATUS_IDS.INVITED) return { status: CANDIDATE_STATUS.INVITED, interview_status: INTERVIEW_STATUS.INVITED };
                 if (statusId === CANDIDATE_STATUS_IDS.INTERVIEWING) return { status: CANDIDATE_STATUS.INTERVIEWING, interview_status: INTERVIEW_STATUS.IN_PROGRESS };
                 if (statusId === CANDIDATE_STATUS_IDS.COMPLETED) return { status: CANDIDATE_STATUS.COMPLETED, interview_status: INTERVIEW_STATUS.COMPLETED };
                 return { status: CANDIDATE_STATUS.PENDING, interview_status: INTERVIEW_STATUS.PENDING };
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