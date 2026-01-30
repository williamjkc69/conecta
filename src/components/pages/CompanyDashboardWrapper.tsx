"use client";

import React from "react";
import CompanyDashboard from "./CompanyDashboard";
// Import any other necessary components or logic if needed by the wrapper
// For now, it seems the CompanyDashboard is self-contained or uses AuthStore directly.
// If access control is needed, we can add it here.
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const CompanyDashboardWrapper: React.FC = () => {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!user) {
    // Redirection logic can be improved, but for now safe guard
    if (typeof window !== "undefined") router.push("/");
    return null;
  }

  return <CompanyDashboard />;
};

export default CompanyDashboardWrapper;
