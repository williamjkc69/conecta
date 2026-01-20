import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useCompanyProfile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        .from('profiles')
        .select('id, role, company_name')
        .eq('id', user.id)
        .single();

      if (profileError || !data) {
        console.error("[useCompanyProfile] Profile not found or error:", profileError?.message);
        throw new Error("Tu perfil de empresa no se encontró. Serás desconectado.");
      }

      if (data.role !== 'company') {
        console.error(`[useCompanyProfile] Invalid role. Expected 'company', got '${data.role}'`);
        throw new Error(`Rol de usuario inválido. Serás desconectado.`);
      }
      
      console.log("[useCompanyProfile] Profile fetched successfully:", data);
      setProfile(data);

    } catch (err) {
      console.error("[useCompanyProfile] Catch block error:", err.message);
      setError(err.message);
      toast({
        title: "Error de Perfil",
        description: err.message,
        variant: "destructive",
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