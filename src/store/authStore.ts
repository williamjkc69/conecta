import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { AuthState, User, AppUser, Session } from "@/types";

interface AuthActions {
  setUser: (user: User | null) => void;
  setProfile: (profile: AppUser | null) => void;
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
        .from("users")
        .select(
          `
          *,
          role:roles(name),
          company:companies(*)
        `
        )
        .eq("auth_user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
        set({ profile: null });
      } else {
        const appUser: AppUser = {
          ...data,
          full_name: `${data.name || ""} ${data.lastname || ""}`.trim(),
          role: Array.isArray(data.role) ? data.role[0] : data.role,
          company: Array.isArray(data.company) ? data.company[0] : data.company
        };

        set((state) => {
          // Sync profile data into user.user_metadata
          const updatedUser = state.user
            ? {
                ...state.user,
                user_metadata: {
                  ...state.user.user_metadata,
                  full_name: appUser.full_name,
                  company_name: appUser.company?.name
                }
              }
            : state.user;
          return { profile: appUser, user: updatedUser };
        });

        // Sync to Supabase Auth
        await supabase.auth.updateUser({
          data: {
            full_name: appUser.full_name,
            company_name: appUser.company?.name
          }
        });
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
      // session object changes often
      set({ session: session as any, user: (session?.user as any) ?? null });

      if (session?.user) {
        // Only fetch if not already loaded or different user
        // Note: checking profile.auth_user_id (new field) vs session.user.id
        const currentProfile = get().profile;
        if (
          !currentProfile ||
          currentProfile.auth_user_id !== session.user.id
        ) {
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
    set({ user: null, session: null, profile: null });
    return { error };
  }
}));
