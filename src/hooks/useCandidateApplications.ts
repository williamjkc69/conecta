import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const useCandidateApplications = (userId?: string) => {
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
            jobs ( * ),
            companies:profiles!applications_company_id_fkey ( company_name )
          `
          )
          .eq("candidate_id", userId)
          .order("applied_at", { ascending: false });

        if (error) throw error;

        if (isMounted) {
          const formattedData = data.map((app: any) => ({
            ...app,
            jobTitle: app.jobs?.title,
            companyName: app.companies?.company_name,
            location: app.jobs?.location,
            salary: app.jobs?.salary,
            type: app.jobs?.type,
            description: app.jobs?.description,
            requirements: app.jobs?.requirements,
            interview_status: app.interview_status || "pending"
          }));

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
          filter: `candidate_id=eq.${userId}`
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
