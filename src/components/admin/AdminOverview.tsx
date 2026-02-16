"use client";

import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Users,
  Building,
  User,
  Briefcase,
  FileText
} from "lucide-react";
import { TITLES, LABELS, MESSAGES } from "@/constants/text";

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
  <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    companies: 0,
    candidates: 0,
    jobs: 0,
    applications: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      const { count: companies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      // Fetch candidate role ID first
      const { data: candidateRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "candidate")
        .single();

      let candidates = 0;
      if (candidateRole) {
        const { count } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role_id", candidateRole.id);
        candidates = count || 0;
      }

      const { count: jobs } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true });

      const { count: applications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: totalUsers || 0,
        companies: companies || 0,
        candidates,
        jobs: jobs || 0,
        applications: applications || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <Loader2 className="mx-auto mt-10 w-8 h-8 animate-spin text-cyan-400" />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-100">
        {TITLES.PLATFORM_SUMMARY}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title={LABELS.TOTAL_USERS}
          value={stats.totalUsers}
          icon={<Users className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          title={LABELS.COMPANIES}
          value={stats.companies}
          icon={<Building className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          title={LABELS.CANDIDATES}
          value={stats.candidates}
          icon={<User className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          title={LABELS.JOBS_CREATED}
          value={stats.jobs}
          icon={<Briefcase className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          title={LABELS.APPLICATIONS}
          value={stats.applications}
          icon={<FileText className="h-4 w-4 text-slate-400" />}
        />
      </div>
      <div className="text-slate-400 text-sm">
        <p>{MESSAGES.ANALYTICS_COMING_SOON}</p>
      </div>
    </div>
  );
};

export default AdminOverview;
