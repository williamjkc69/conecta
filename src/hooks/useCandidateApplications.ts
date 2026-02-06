import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const useCandidateApplications = (userId?: number) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchApplications = async () => {
      const timestamp = new Date().toISOString();
      console.log(
        `[${timestamp}] [useCandidateApplications] Starting fetch for user: ${userId}`
      );

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("applications")
          .select(
            `
            *,
            listing:listings (
              id,
              title,
              description,
              location,
              salary_range_min,
              salary_range_max,
              salary_currency,
              status,
              listing_type:listing_types(name),
              company:companies(id, name),
              listing_skills(
                skill:skills(id, name)
              )
            ),
            status:application_statuses(name)
          `
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (isMounted) {
          const formattedData = data.map((app: any) => {
            const listing = app.listing;
            const company = listing?.company;
            const statusName = Array.isArray(app.status)
              ? app.status[0]?.name
              : app.status?.name;

            // Format salary with currency
            let salaryDisplay = null;
            if (listing?.salary_range_min && listing?.salary_range_max) {
              const currency = listing?.salary_currency || "$";
              salaryDisplay = `${currency}${listing.salary_range_min} - ${currency}${listing.salary_range_max}`;
            }

            // Extract skills from listing_skills
            const skills =
              listing?.listing_skills
                ?.map((ls: any) => ls.skill?.name)
                .filter(Boolean) || [];

            // Derive interview_status from status and interview fields
            let interviewStatus = "pending";
            if (statusName === "completed") {
              interviewStatus = "completed";
            } else if (statusName === "invited") {
              interviewStatus = "invited";
            } else if (statusName === "interviewing") {
              interviewStatus = "in_progress";
            } else if (app.call_id) {
              // Has started interview
              interviewStatus = "in_progress";
            }

            return {
              ...app,
              id: app.id,
              status: statusName || "pending",
              interview_status: interviewStatus,
              // Job/Listing info
              jobTitle: listing?.title,
              companyName: company?.name || "Unknown Company",
              location: listing?.location,
              salary: salaryDisplay,
              type: listing?.listing_type?.name,
              description: listing?.description,
              skills: skills,
              requirements: skills, // For backward compatibility with modal
              // Interview fields
              interview_decision: app.interview_decision,
              interview_duration: app.interview_duration,
              interview_duration_minutes: app.interview_duration_minutes,
              technical_competency_score: app.technical_competency_score,
              // Additional fields
              listing_id: listing?.id,
              company_id: company?.id,
              appliedAt: app.created_at,
              completedAt: app.completed_at
            };
          });

          console.log(
            `[${new Date().toISOString()}] [useCandidateApplications] Fetch complete. Found ${formattedData.length} apps.`
          );
          formattedData.forEach((app: any) => {
            console.log(
              `   - App ID: ${app.id} | Status: ${app.status} | Interview Status: ${app.interview_status}`
            );
          });

          setApplications(formattedData);
          setError(null);
        }
      } catch (err) {
        console.error(
          `[${new Date().toISOString()}] [useCandidateApplications] Error fetching:`,
          err
        );
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApplications();

    const channel = supabase
      .channel(`candidate-dashboard-${userId}`)
      .on(
        // @ts-ignore - Supabase types
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log(
            `[${new Date().toISOString()}] [useCandidateApplications] Realtime update received:`,
            payload
          );
          fetchApplications();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(
            `[${new Date().toISOString()}] [useCandidateApplications] Subscribed to realtime updates.`
          );
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { applications, loading, error };
};
