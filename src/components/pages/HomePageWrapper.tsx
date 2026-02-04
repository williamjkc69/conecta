"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import HomePage from "./HomePage";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePageWrapper() {
  const router = useRouter();
  const { user, profile, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user) {
      const userRoleName = profile?.role?.name || user?.user_metadata?.type;

      if (userRoleName === "admin") {
        router.push("/admin-dashboard/overview");
      } else if (userRoleName === "company") {
        router.push("/company-dashboard");
      } else if (userRoleName === "candidate") {
        router.push("/candidate-dashboard");
      }
    }
  }, [user, profile, loading, router]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  if (user) {
    // While redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <HomePage onNavigate={handleNavigate} />
    </Suspense>
  );
}
