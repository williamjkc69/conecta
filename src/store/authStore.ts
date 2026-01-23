import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { AuthState, User, Profile, Session } from "@/types";

interface AuthActions {
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<() => void>;
  signOut: () => Promise<{ error: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    options: any
  ) => Promise<{ data: any; error: any }>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signUp: async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });
    return { data, error };
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
        set({ profile: null });
      } else {
        set({ profile: data });
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      set({ profile: null });
    }
  },

  initializeAuth: async () => {
    set({ loading: true });

    // Initial session check
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session) {
      set({ session: session as any, user: session.user as any });
      if (session.user) {
        await get().fetchProfile(session.user.id);
      }
    } else {
      set({ session: null, user: null, profile: null });
    }
    set({ loading: false });

    // Listener
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentSession = get().session;
      // Avoid redundant updates if logic allows, but session object changes often
      set({ session: session as any, user: (session?.user as any) ?? null });

      if (session?.user) {
        // Only fetch if not already loaded or different user
        if (!get().profile || get().profile?.id !== session.user.id) {
          await get().fetchProfile(session.user.id);
        }
      } else {
        set({ profile: null });
      }
      set({ loading: false });
    });

    return () => subscription.unsubscribe();
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    // Clear state regardless of error (client side)
    set({ user: null, session: null, profile: null });
    return { error };
  }
}));
