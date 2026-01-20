import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user) => {
    console.log('--- SupabaseAuthContext: fetchProfile ---');
    if (user) {
      console.log('Attempting to fetch profile for user:', user.email);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      }
    } else {
      console.log('No user to fetch profile for.');
      setProfile(null);
    }
    console.log('-----------------------------------------');
  }, []);

  const handleSession = useCallback(async (session) => {
    console.log('--- SupabaseAuthContext: handleSession ---');
    console.log('Session state changed:', session);
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    await fetchProfile(currentUser);
    setLoading(false);
     console.log('------------------------------------------');
  }, [fetchProfile]);


  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed, event:', _event);
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
       if (error.message.includes('User already registered')) {
        toast({
          variant: "destructive",
          title: "Email ya registrado",
          description: "Este email ya está registrado. Por favor, inicia sesión.",
        });
      } else if (error.message.includes('duplicate key value violates unique constraint "profiles_document_number_key"')) {
        toast({
          variant: "destructive",
          title: "Documento ya registrado",
          description: "Este número de documento ya está asociado a otra cuenta.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error en el registro",
          description: error.message || "Algo salió mal",
        });
      }
    } else {
      toast({
        title: "🎉 ¡Registro exitoso!",
        description: "Revisa tu correo para confirmar tu cuenta.",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales incorrectas",
      });
    } else {
       toast({
        title: "✅ ¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente.",
      });
    }

    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    
    // This handles benign errors where the session might already be invalid on the server.
    const isBenignError = error && (error.code === 403 || (error.message && error.message.includes('Session from session_id claim in JWT does not exist')));

    if (error && !isBenignError) {
        toast({
            variant: "destructive",
            title: "Error al cerrar sesión",
            description: error.message || "Algo salió mal",
        });
    } else {
        // Clear local state regardless of benign errors to ensure a clean logout.
        setUser(null);
        setSession(null);
        setProfile(null);
    }

    return { error: isBenignError ? null : error };
  }, [toast]);

  const resetPasswordForEmail = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
        toast({
            variant: "destructive",
            title: "Error al enviar email",
            description: error.message,
        });
    } else {
        toast({
            title: "Correo enviado",
            description: "Si el correo es válido, recibirás un enlace para recuperar tu contraseña.",
        });
    }
  }, [toast]);

  const updateUser = useCallback(async (credentials) => {
    const { data, error } = await supabase.auth.updateUser(credentials);
    if(error){
        toast({
            variant: "destructive",
            title: "Error al actualizar",
            description: error.message
        });
    }
    return { data, error };
  }, [toast]);


  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    updateUser,
  }), [user, profile, session, loading, signUp, signIn, signOut, resetPasswordForEmail, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};