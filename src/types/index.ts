export interface User {
  id: string; // Auth ID (UUID)
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

export interface Role {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  description?: string;
  logo?: string;
  verified_at?: string;
  created_at: string;
}

export interface ListingType {
  id: number;
  name: string;
}

export interface Listing {
  id: number;
  company_id: number;
  company?: Company;
  title: string;
  description?: string;
  listing_type_id?: number;
  listing_type?: ListingType; // Joined
  location?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  salary_currency?: string;
  salary_type?: string;
  status: string;
  created_at: string;
  skills?: string[]; // Mapped from listing_skills
  questions?: string[]; // Mapped from listing_questions
}

export interface ApplicationStatus {
  id: number;
  name: string;
}

export interface Application {
  id: number;
  listing_id: number;
  listing?: Listing;
  user_id: number; // Integer ID
  user?: AppUser;
  status_id?: number;
  status?: string; // Joined status name or mapped
  completed_at?: string;
  interview_duration?: number;
  interview_decision?: string;
  feedback?: string;
  created_at: string;
  report?: Report;
}

export interface Report {
  id: number;
  application_id: number;
  json_data: any;
  created_at: string;
}

// Renamed from Profile to AppUser, but kept Profile alias for backward compat during refactor if needed?
// No, I'll update references.
export interface AppUser {
  id: number; // Integer ID
  auth_user_id: string; // UUID
  email: string;
  role_id: number;
  role?: { name: string }; // Joined
  company_id?: number;
  company?: Company; // Joined
  name?: string;
  lastname?: string;
  full_name?: string; // Derived/Mapped for convenience
  verified_at?: string;
  avatar_url?: string;
  document_number?: string;
  created_at: string;
}

// Session remains mostly same but `user` is Auth User.
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User | null;
}

export interface AuthState {
  user: User | null;
  profile: AppUser | null; // Changed type
  session: Session | null;
  loading: boolean;
}
