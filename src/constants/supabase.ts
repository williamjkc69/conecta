/**
 * Supabase Configuration Constants
 */

// Supabase Tables
export const TABLES = {
  APPLICATIONS: "applications",
  LISTINGS: "listings",
  USERS: "users",
  INVITATIONS: "invitations",
  COMPANIES: "companies",
  APPLICATION_STATUSES: "application_statuses"
} as const;

// Supabase Buckets
export const BUCKETS = {
  RECORDINGS: "recordings",
  AVATARS: "avatars",
  CV: "cv"
} as const;
