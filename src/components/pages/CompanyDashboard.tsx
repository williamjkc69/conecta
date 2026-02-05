"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  FileText,
  Clock,
  Plus,
  LogOut,
  BarChart3,
  Loader2,
  Mail,
  AlertTriangle,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import JobFormModal from "@/components/features/JobFormModal";
import JobDetailsModal from "@/components/features/JobDetailsModal";
import JobCard from "@/components/features/JobCard";
import CandidateList from "@/components/features/CandidateList";
import { supabase } from "@/lib/supabase";
import InviteCandidateModal from "@/components/features/InviteCandidateModal";
import AssignCandidateModal from "@/components/features/AssignCandidateModal";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { useAuthStore } from "@/store/authStore";
import CompanyOnboardingModal from "@/components/features/CompanyOnboardingModal";
import {
  BUTTONS,
  TITLES,
  MESSAGES,
  TABS,
  TAB_LABELS,
  LABELS,
  PLACEHOLDERS
} from "@/constants/text";
import { ROUTES } from "@/constants/routes";

const CompanyDashboard: React.FC = () => {
  const router = useRouter();
  const { user, signOut: authSignOut } = useAuthStore();
  const { toast } = useToast();
  // @ts-ignore - hook needs TS conversion
  const {
    profile,
    loading: loadingProfile,
    error: profileError,
    refetch: refetchProfile
  } = useCompanyProfile();

  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showInviteCandidate, setShowInviteCandidate] = useState(false);
  const [showAssignCandidate, setShowAssignCandidate] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobToEdit, setJobToEdit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingData, setLoadingData] = useState(true);
  const [statsData, setStatsData] = useState({ interviews: 0, applicants: 0 });

  // Loading states for async operations
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);
  const [isDeletingJob, setIsDeletingJob] = useState(false);

  const handleLogout = async () => {
    await authSignOut();
    router.push("/");
  };

  const fetchCompanyData = useCallback(async () => {
    if (!profile || !profile.company) return;
    setLoadingData(true);

    try {
      // Fetch listings with all related data
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(
          `
          *,
          listing_type:listing_types(id, name),
          listing_skills(
            skill:skills(id, name)
          ),
          listing_questions(id, question)
        `
        )
        .eq("company_id", profile.company.id);

      if (listingsError) throw listingsError;

      // Transform the data to match the expected format
      const transformedListings = listingsData.map((listing: any) => ({
        ...listing,
        type: listing.listing_type?.name || "Full-time",
        salary:
          listing.salary_range_min && listing.salary_range_max
            ? `${listing.salary_currency || "USD"} ${listing.salary_range_min.toLocaleString()} - ${listing.salary_range_max.toLocaleString()}`
            : listing.salary_range_min
              ? `${listing.salary_currency || "USD"} ${listing.salary_range_min.toLocaleString()}+`
              : "-",
        requirements:
          listing.listing_skills
            ?.map((ls: any) => ls.skill?.name)
            .filter(Boolean) || [],
        questions:
          listing.listing_questions
            ?.map((lq: any) => lq.question)
            .filter(Boolean) || []
      }));

      const listingIds = transformedListings.map((j: any) => j.id);
      let appsData: any[] = [];

      if (listingIds.length > 0) {
        const { data: fetchedApps, error: appsError } = await supabase
          .from("applications")
          .select("*")
          .in("listing_id", listingIds)
          .order("created_at", { ascending: false });
        if (appsError) throw appsError;
        appsData = fetchedApps || [];
      }

      const listingsWithCounts = transformedListings.map((listing: any) => ({
        ...listing,
        applicants: appsData.filter((app) => app.listing_id === listing.id)
          .length
      }));

      setJobs(listingsWithCounts);

      // Status names might differ. Map if necessary or use status_id.
      // Assuming 'status' (joined?) or we need to fetch status name.
      // For now, assume status_id logic:
      // If we don't have joined status name, we might be blind.
      // Fetching applications with status name joined: select('*, status:application_statuses(name)')

      // We will refetch applications with joins to be safe
      if (listingIds.length > 0) {
        const { data: fetchedAppsJoined } = await supabase
          .from("applications")
          .select("*, status:application_statuses(name)")
          .in("listing_id", listingIds)
          .order("created_at", { ascending: false });

        appsData = fetchedAppsJoined || [];
      }

      setStatsData({
        applicants: appsData.length,
        interviews: appsData.filter((app: any) =>
          ["interviewing", "completed", "approved"].includes(
            app.status?.name || ""
          )
        ).length
      });

      const userIds = Array.from(
        new Set(appsData.map((app) => app.user_id).filter((id) => id))
      );

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, name, lastname, email")
          .in("id", userIds);

        if (usersError) throw usersError;

        const usersMap = new Map(usersData.map((u: any) => [u.id, u]));
        const formattedCandidates = appsData.map((app: any) => {
          const user: any = usersMap.get(app.user_id);
          const fullName = user
            ? `${user.name || ""} ${user.lastname || ""}`.trim()
            : "Nombre no disponible";

          return {
            id: app.id,
            status: app.status?.name || "pending",
            job_id: app.listing_id, // map back for UI consistency if needed
            appliedAt: app.created_at,
            candidateName: fullName || "Nombre no disponible",
            candidateEmail: user?.email || "Email no disponible"
          };
        });
        setCandidates(formattedCandidates);
      } else {
        setCandidates([]);
      }
    } catch (error: any) {
      console.error("[CompanyDashboard] Error fetching data:", error);
      toast({
        title: TITLES.ERROR,
        description: `${MESSAGES.ERROR_FETCHING_DATA}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleCreateJob = async (jobData: any) => {
    setIsCreatingJob(true);
    try {
      if (!profile?.company) throw new Error("No company profile found");

      // Backend validation
      if (!jobData.title || jobData.title.trim().length < 3) {
        throw new Error(MESSAGES.TITLE_MIN_LENGTH);
      }

      if (!jobData.description || jobData.description.trim().length < 50) {
        throw new Error(MESSAGES.DESC_MIN_LENGTH);
      }

      if (
        !jobData.listing_type_id ||
        typeof jobData.listing_type_id !== "number"
      ) {
        throw new Error(MESSAGES.INVALID_CONTRACT_TYPE);
      }

      if (!jobData.salary_range_min || jobData.salary_range_min <= 0) {
        throw new Error(MESSAGES.INVALID_SALARY);
      }

      if (
        jobData.salary_range_max &&
        jobData.salary_range_max < jobData.salary_range_min
      ) {
        throw new Error(MESSAGES.MAX_SALARY_ERROR);
      }

      if (
        !jobData.currency ||
        !["USD", "EUR", "MXN", "COP", "ARS", "CLP", "PEN"].includes(
          jobData.currency
        )
      ) {
        throw new Error(MESSAGES.INVALID_CURRENCY);
      }

      if (!jobData.requirements || jobData.requirements.length === 0) {
        throw new Error(MESSAGES.REQUIREMENT_NEEDED);
      }

      console.log("Creating job with data:", jobData);

      // 1. Create the listing
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .insert({
          company_id: profile.company.id,
          title: jobData.title.trim(),
          description: jobData.description.trim(),
          location: jobData.location?.trim() || null,
          listing_type_id: jobData.listing_type_id,
          salary_range_min: jobData.salary_range_min,
          salary_range_max: jobData.salary_range_max,
          salary_currency: jobData.currency,
          status: "active"
        })
        .select()
        .single();

      if (listingError) throw listingError;
      if (!listingData) throw new Error("Failed to create listing");

      const listingId = listingData.id;
      console.log("Listing created with ID:", listingId);

      // 2. Handle Skills (Requirements)
      if (jobData.requirements && jobData.requirements.length > 0) {
        for (const skillName of jobData.requirements) {
          if (!skillName.trim()) continue;

          // Check if skill exists
          const { data: existingSkill, error: searchError } = await supabase
            .from("skills")
            .select("id")
            .ilike("name", skillName.trim())
            .maybeSingle();

          let skillId: number;

          if (existingSkill) {
            skillId = existingSkill.id;
            console.log(
              "Found existing skill:",
              skillName,
              "with ID:",
              skillId
            );
          } else {
            // Create new skill
            const { data: newSkill, error: skillError } = await supabase
              .from("skills")
              .insert({ name: skillName.trim() })
              .select()
              .single();

            if (skillError) {
              console.error("Error creating skill:", skillError);
              continue; // Skip this skill but continue with others
            }

            if (!newSkill) {
              console.error("Failed to create skill:", skillName);
              continue;
            }

            skillId = newSkill.id;
            console.log("Created new skill:", skillName, "with ID:", skillId);
          }

          // Link skill to listing
          const { error: linkError } = await supabase
            .from("listing_skills")
            .insert({
              listing_id: listingId,
              skill_id: skillId
            });

          if (linkError) {
            console.error("Error linking skill to listing:", linkError);
          }
        }
      }

      // 3. Handle Questions
      if (jobData.questions && jobData.questions.length > 0) {
        const questionsToInsert = jobData.questions.map((question: string) => ({
          listing_id: listingId,
          question: question.trim()
        }));

        const { error: questionsError } = await supabase
          .from("listing_questions")
          .insert(questionsToInsert);

        if (questionsError) {
          console.error("Error inserting questions:", questionsError);
          // Don't throw, just log - questions are not critical
        }
      }

      toast({
        title: TITLES.JOB_CREATED_SUCCESS,
        description: MESSAGES.JOB_CREATED_DESC
      });
      setShowCreateJob(false);
      fetchCompanyData();
    } catch (error: any) {
      console.error("[handleCreateJob] Error:", error.message);
      toast({
        title: TITLES.CREATE_JOB_ERROR,
        description: error.message || MESSAGES.ERROR_CREATING_JOB,
        variant: "destructive"
      });
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleUpdateJob = async (jobData: any) => {
    setIsUpdatingJob(true);
    try {
      const { id, requirements, questions, ...updateData } = jobData;

      // 1. Update the listing
      const { error: listingError } = await supabase
        .from("listings")
        .update({
          title: updateData.title,
          description: updateData.description,
          location: updateData.location,
          listing_type_id: updateData.listing_type_id,
          salary_range_min: updateData.salary_range_min,
          salary_range_max: updateData.salary_range_max,
          salary_currency: updateData.currency,
          status: updateData.status
        })
        .eq("id", id);

      if (listingError) throw listingError;

      // 2. Update Skills - Delete existing and insert new ones
      if (requirements && requirements.length > 0) {
        // Delete existing skills for this listing
        await supabase.from("listing_skills").delete().eq("listing_id", id);

        // Insert new skills
        for (const skillName of requirements) {
          if (!skillName.trim()) continue;

          // Check if skill exists
          const { data: existingSkill } = await supabase
            .from("skills")
            .select("id")
            .ilike("name", skillName.trim())
            .maybeSingle();

          let skillId: number;

          if (existingSkill) {
            skillId = existingSkill.id;
          } else {
            // Create new skill
            const { data: newSkill, error: skillError } = await supabase
              .from("skills")
              .insert({ name: skillName.trim() })
              .select()
              .single();

            if (skillError || !newSkill) {
              console.error("Error creating skill:", skillError);
              continue;
            }

            skillId = newSkill.id;
          }

          // Link skill to listing
          await supabase.from("listing_skills").insert({
            listing_id: id,
            skill_id: skillId
          });
        }
      }

      // 3. Update Questions - Delete existing and insert new ones
      if (questions && questions.length > 0) {
        // Delete existing questions
        await supabase.from("listing_questions").delete().eq("listing_id", id);

        // Insert new questions
        const questionsToInsert = questions
          .filter((q: string) => q.trim() !== "")
          .map((question: string) => ({
            listing_id: id,
            question: question.trim()
          }));

        if (questionsToInsert.length > 0) {
          await supabase.from("listing_questions").insert(questionsToInsert);
        }
      }

      toast({
        title: TITLES.JOB_UPDATED_SUCCESS,
        description: MESSAGES.JOB_UPDATED_DESC
      });
      setJobToEdit(null);
      fetchCompanyData();
    } catch (error: any) {
      console.error("[handleUpdateJob] Error:", error);
      toast({
        title: "Error",
        description: `No se pudo actualizar la vacante: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingJob(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    setIsDeletingJob(true);
    try {
      // Delete listing (cascade deletes applications)
      const { error: jobError } = await supabase
        .from("listings")
        .delete()
        .eq("id", jobId);

      if (jobError) {
        toast({
          title: "Error",
          description: `No se pudo eliminar la vacante: ${jobError.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: TITLES.JOB_DELETED_SUCCESS,
          description: MESSAGES.JOB_DELETED_DESC
        });
        setSelectedJob(null);
        setJobToEdit(null);
        fetchCompanyData();
      }
    } finally {
      setIsDeletingJob(false);
    }
  };

  const pendingInterviewsCount = candidates.filter(
    (c) => c.status === "applied"
  ).length;

  const stats = [
    {
      icon: <Briefcase className="w-6 h-6" />,
      label: LABELS.ACTIVE_JOBS,
      value: jobs.filter((j) => j.status === "active").length,
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: LABELS.TOTAL_CANDIDATES,
      value: statsData.applicants,
      color: "from-green-600 to-emerald-600"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: LABELS.TOTAL_INTERVIEWS,
      value: statsData.interviews,
      color: "from-pink-600 to-rose-600"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: LABELS.PENDING_INTERVIEWS,
      value: pendingInterviewsCount,
      color: "from-orange-600 to-yellow-600"
    }
  ];

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
        <p className="text-slate-300">{MESSAGES.CHECKING_PROFILE}</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-400 mb-2">
          {TITLES.PROFILE_ERROR}
        </h2>
        <p className="text-slate-300 max-w-md mb-6">{profileError}</p>
        <Button onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          {BUTTONS.BACK_HOME}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-900 text-white">
      <div className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                {TITLES.COMPANY_DASHBOARD}
              </h1>
              <p className="text-sm text-slate-400">
                {MESSAGES.WELCOME} {profile?.company?.name || user?.email}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowAssignCandidate(true)}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
              >
                <UserPlus className="w-4 h-4 mr-2" /> {BUTTONS.ASSIGN_BY_DOC}
              </Button>
              <Button
                onClick={() => setShowInviteCandidate(true)}
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <Mail className="w-4 h-4 mr-2" /> {BUTTONS.INVITE_CANDIDATE}
              </Button>
              <Button
                onClick={() => setShowCreateJob(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> {BUTTONS.CREATE_JOB}
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" /> {BUTTONS.LOGOUT}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}
                >
                  {stat.icon}
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-50">{stat.value}</p>
            </motion.div>
          ))}
        </div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 mb-8">
          <div className="flex border-b border-slate-700 overflow-x-auto">
            {[TABS.OVERVIEW, TABS.JOBS, TABS.CANDIDATES, TABS.ANALYTICS].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-6 py-4 font-semibold transition-all ${activeTab === tab ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400 hover:text-slate-100"}`}
                >
                  {tab === TABS.OVERVIEW && TAB_LABELS.OVERVIEW}
                  {tab === TABS.JOBS && TAB_LABELS.JOBS}
                  {tab === TABS.CANDIDATES && TAB_LABELS.CANDIDATES}
                  {tab === TABS.ANALYTICS && TAB_LABELS.ANALYTICS}
                </button>
              )
            )}
          </div>

          <div className="p-6">
            {loadingData ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-slate-100">
                        {TITLES.RECENT_JOBS}
                      </h3>
                      {jobs.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                          {jobs.slice(0, 2).map((job) => (
                            <JobCard
                              key={job.id}
                              job={job}
                              onClick={() => setSelectedJob(job)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400">
                          {MESSAGES.NO_JOBS_CREATED}
                        </p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-slate-100">
                        {TITLES.RECENT_ACTIVITY}
                      </h3>
                      {candidates.length > 0 ? (
                        <div className="space-y-3">
                          {candidates.slice(0, 3).map((activity, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50"
                            >
                              <div>
                                <p className="font-semibold text-slate-200">
                                  {activity.candidateName} aplicó para{" "}
                                  {jobs.find((j) => j.id === activity.job_id)
                                    ?.title || "N/A"}
                                </p>
                              </div>
                              <span className="text-sm text-slate-500">
                                {new Date(
                                  activity.appliedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400">
                          {MESSAGES.NO_RECENT_ACTIVITY}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === "jobs" && (
                  <div>
                    {jobs.length === 0 ? (
                      <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400 mb-4">
                          {MESSAGES.NO_JOBS}
                        </p>
                        <Button
                          onClick={() => setShowCreateJob(true)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                        >
                          {BUTTONS.CREATE_FIRST_JOB}
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {jobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onClick={() => setSelectedJob(job)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "candidates" && (
                  <CandidateList candidates={candidates} jobs={jobs} />
                )}
                {activeTab === "analytics" && (
                  <div className="flex flex-col items-center justify-center text-center h-64">
                    <BarChart3 className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">
                      {MESSAGES.ANALYTICS_COMING_SOON}
                    </h3>
                    <p className="text-slate-500">{MESSAGES.COME_BACK_SOON}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <JobFormModal
        isOpen={showCreateJob}
        onClose={() => setShowCreateJob(false)}
        onSubmit={handleCreateJob}
        mode="create"
        isLoading={isCreatingJob}
      />
      <InviteCandidateModal
        isOpen={showInviteCandidate}
        onClose={() => setShowInviteCandidate(false)}
        onInviteSent={fetchCompanyData}
        jobs={jobs.filter((j) => j.status === "active")}
      />
      <AssignCandidateModal
        isOpen={showAssignCandidate}
        onClose={() => setShowAssignCandidate(false)}
        onAssignmentSuccess={fetchCompanyData}
        jobs={jobs.filter((j) => j.status === "active")}
      />

      {/* Details Modal (Read-only) */}
      {selectedJob && (
        <JobDetailsModal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          job={selectedJob}
          onEdit={() => {
            setJobToEdit(selectedJob);
            setSelectedJob(null);
          }}
          onDelete={handleDeleteJob}
          isDeleting={isDeletingJob}
        />
      )}

      {/* Edit Modal */}
      {jobToEdit && (
        <JobFormModal
          isOpen={!!jobToEdit}
          onClose={() => setJobToEdit(null)}
          job={jobToEdit}
          onSubmit={handleUpdateJob}
          onDelete={handleDeleteJob}
          mode="edit"
          isLoading={isUpdatingJob}
          isDeleting={isDeletingJob}
        />
      )}

      {!loadingProfile && profile && !profile.company && profile?.id && (
        <CompanyOnboardingModal
          userId={profile.id} // This is the public.users id
          onSuccess={() => {
            refetchProfile(); // Refresh profile to get the new company
          }}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;
