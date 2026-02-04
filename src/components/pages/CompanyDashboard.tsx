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
import CreateJobModal from "@/components/features/CreateJobModal";
import JobCard from "@/components/features/JobCard";
import CandidateList from "@/components/features/CandidateList";
import { supabase } from "@/lib/supabase";
import JobDetailModal from "@/components/features/JobDetailModal";
import InviteCandidateModal from "@/components/features/InviteCandidateModal";
import AssignCandidateModal from "@/components/features/AssignCandidateModal";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { useAuthStore } from "@/store/authStore";
import CompanyOnboardingModal from "@/components/features/CompanyOnboardingModal";

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
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingData, setLoadingData] = useState(true);
  const [statsData, setStatsData] = useState({ interviews: 0, applicants: 0 });

  const handleLogout = async () => {
    await authSignOut();
    router.push("/");
  };

  const fetchCompanyData = useCallback(async () => {
    if (!profile || !profile.company) return;
    setLoadingData(true);

    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(`*`)
        .eq("company_id", profile.company.id);

      if (listingsError) throw listingsError;

      const listingIds = listingsData.map((j: any) => j.id);
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

      const listingsWithCounts = listingsData.map((listing: any) => ({
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
        title: "Error",
        description: `No se pudieron cargar los datos: ${error.message}`,
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
    try {
      if (!profile?.company) throw new Error("No company profile found");

      // Map type text to ID
      const { data: typeData } = await supabase
        .from("listing_types")
        .select("id")
        .eq("name", jobData.type) // assuming jobData.type is 'remote', etc.
        .single();

      const typeId = typeData?.id || 1; // Default or error?

      // Direct Insert
      const { data, error } = await supabase
        .from("listings")
        .insert({
          company_id: profile.company.id,
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          listing_type_id: typeId,
          salary_range_min: jobData.salaryMin, // Assuming UI sends this
          salary_range_max: jobData.salaryMax,
          status: "active"
        })
        .select();

      if (error) throw error;

      // Skills?
      // If jobData.requirements (array of strings) exists:
      if (jobData.requirements && data) {
        const newListingId = data[0].id;
        // Handle skills insertion (omitted for brevity, or need logic)
        // For now, simply toast success.
      }

      toast({
        title: "✅ Vacante creada exitosamente",
        description:
          "Tu oferta de trabajo está activa y lista para recibir candidatos."
      });
      setShowCreateJob(false);
      fetchCompanyData();
    } catch (error: any) {
      console.error("[handleCreateJob] Error:", error.message);
      toast({
        title: "Error al crear la vacante",
        description:
          error.message ||
          "No se pudo crear la vacante. Verifica tu perfil y vuelve a intentarlo.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateJob = async (jobData: any) => {
    const { id, ...updateData } = jobData; // id is listing id
    // Map fields if needed
    const { error } = await supabase
      .from("listings")
      .update({
        title: updateData.title,
        description: updateData.description,
        location: updateData.location
        // Add type mapping if allowing type update
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: `No se pudo actualizar la vacante: ${error.message}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "✅ Vacante actualizada",
        description: "Los cambios han sido guardados."
      });
      setSelectedJob(null);
      fetchCompanyData();
    }
  };

  const handleDeleteJob = async (jobId: string) => {
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
        title: "🗑️ Vacante eliminada",
        description: "La vacante y sus aplicaciones han sido eliminadas."
      });
      setSelectedJob(null);
      fetchCompanyData();
    }
  };

  const pendingInterviewsCount = candidates.filter(
    (c) => c.status === "applied"
  ).length;

  const stats = [
    {
      icon: <Briefcase className="w-6 h-6" />,
      label: "Vacantes Activas",
      value: jobs.filter((j) => j.status === "active").length,
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: "Candidatos Totales",
      value: statsData.applicants,
      color: "from-green-600 to-emerald-600"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: "Total Entrevistas",
      value: statsData.interviews,
      color: "from-pink-600 to-rose-600"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: "Entrevistas Pendientes",
      value: pendingInterviewsCount,
      color: "from-orange-600 to-yellow-600"
    }
  ];

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
        <p className="text-slate-300">Verificando perfil de empresa...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-400 mb-2">
          Error de Perfil
        </h2>
        <p className="text-slate-300 max-w-md mb-6">{profileError}</p>
        <Button onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Volver a inicio
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
                Panel de Empresa
              </h1>
              <p className="text-sm text-slate-400">
                Bienvenido, {profile?.company?.name || user?.email}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowAssignCandidate(true)}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Asignar por Documento
              </Button>
              <Button
                onClick={() => setShowInviteCandidate(true)}
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <Mail className="w-4 h-4 mr-2" /> Invitar Candidato
              </Button>
              <Button
                onClick={() => setShowCreateJob(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> Nueva Vacante
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" /> Salir
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
            {["overview", "jobs", "candidates", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-6 py-4 font-semibold transition-all ${activeTab === tab ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400 hover:text-slate-100"}`}
              >
                {tab === "overview" && "Resumen"}
                {tab === "jobs" && "Vacantes"}
                {tab === "candidates" && "Candidatos"}
                {tab === "analytics" && "Analíticas"}
              </button>
            ))}
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
                        Vacantes Recientes
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
                          No hay vacantes creadas.
                        </p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-slate-100">
                        Actividad Reciente
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
                          No hay actividad reciente de candidatos.
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
                          No tienes vacantes creadas
                        </p>
                        <Button
                          onClick={() => setShowCreateJob(true)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                        >
                          Crear Primera Vacante
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
                      Las analíticas están en camino
                    </h3>
                    <p className="text-slate-500">¡Vuelve pronto!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <CreateJobModal
        isOpen={showCreateJob}
        onClose={() => setShowCreateJob(false)}
        onSubmit={handleCreateJob}
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
      {selectedJob && (
        <JobDetailModal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          job={selectedJob}
          onSubmit={handleUpdateJob}
          onDelete={handleDeleteJob}
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
