export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
  aud?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  role?: "admin" | "candidate" | "recruiter";
  [key: string]: any;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User | null;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}
