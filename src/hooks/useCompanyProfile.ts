import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { AppUser } from "@/types";

export const useCompanyProfile = () => {
  const { user, signOut } = useAuthStore();
  const { toast } = useToast();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log("[useCompanyProfile] Fetching profile for user:", user.id);
    setLoading(true);
    setError(null);

    try {
      const { data, error: profileError } = await supabase
        .from("users")
        .select(
          `
          id,
          role:roles(name),
          company:companies(*),
          auth_user_id
        `
        )
        .eq("auth_user_id", user.id)
        .single();

      if (profileError || !data) {
        console.error(
          "[useCompanyProfile] Profile not found or error:",
          profileError?.message
        );
        throw new Error(
          "Tu perfil de empresa no se encontró. Serás desconectado."
        );
      }

      // Check role (data.role is object {name: 'company'})
      const roleData = data.role as any;
      const roleName = Array.isArray(roleData)
        ? roleData[0]?.name
        : roleData?.name;
      if (roleName !== "company") {
        console.error(
          `[useCompanyProfile] Invalid role. Expected 'company', got '${roleName}'`
        );
        throw new Error(`Rol de usuario inválido. Serás desconectado.`);
      }

      const companyData = data.company as any;
      const company = Array.isArray(companyData) ? companyData[0] : companyData;

      // If no company, we don't throw, we just let the UI handle the "Onboarding" state
      // if (!company) {
      //   throw new Error("No tienes una compañía asignada.");
      // }

      console.log("[useCompanyProfile] Profile fetched successfully:", data);

      // Construct AppUser compatible object
      const appUser: any = {
        ...data,
        role: { name: roleName },
        company_name: company?.name || "", // Backward compat
        company: company || null // Explicitly handle null
      };

      setProfile(appUser);
    } catch (err: any) {
      console.error("[useCompanyProfile] Catch block error:", err.message);
      setError(err.message);
      toast({
        title: "Error de Perfil",
        description: err.message,
        variant: "destructive"
      });
      // Log out user if profile is invalid to force a clean state
      await signOut();
    } finally {
      setLoading(false);
    }
  }, [user, toast, signOut]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};
