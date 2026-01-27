"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function VerificationGuard({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      // If auth is strictly loading, wait
      if (authLoading) return;

      if (!user) {
        // Not logged in, redirect to home/login
        router.push("/");
        return;
      }

      // Check profile verification
      // If profile is already loaded in store, use it.
      // Add a fallback fetch if profile.verified_at is missing (might not be in type yet)
      let verifiedAt = profile?.verified_at;

      if (profile && verifiedAt === undefined) {
        // Fetch fresh to be sure (and if store doesn't have the col yet)
        const { data } = await supabase
          .from("profiles")
          .select("verified_at")
          .eq("id", user.id)
          .single();
        verifiedAt = data?.verified_at;
      }

      if (!verifiedAt) {
        router.push("/verify-email");
      } else {
        setChecking(false);
      }
    };

    checkVerification();
  }, [user, profile, authLoading, router]);

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
