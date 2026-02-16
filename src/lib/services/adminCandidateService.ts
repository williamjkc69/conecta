import { supabase } from "@/lib/supabase";

export interface AdminCandidate {
  id: string;
  full_name: string;
  email: string;
  interviews_count: number;
  last_status: string;
  created_at: string;
}

export const fetchAdminCandidates = async ({
  searchTerm = "",
  page = 1,
  limit = 10
}: {
  searchTerm?: string;
  page?: number;
  limit?: number;
}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Get candidate role ID
  const { data: roleData } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "candidate")
    .single();

  if (!roleData) return { users: [], count: 0 };

  let query = supabase
    .from("users")
    .select("*, role:roles!inner(name)", { count: "exact" }) // inner join ensures role matches
    .eq("role_id", roleData.id);

  if (searchTerm) {
    query = query.or(
      `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
    );
  }

  const { data, count, error } = await query
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }

  const users: AdminCandidate[] = (data || []).map((user) => ({
    id: user.id,
    full_name: user.full_name || "N/A",
    email: user.email,
    interviews_count: 0, // Placeholder
    last_status: "invited", // Placeholder
    created_at: user.created_at
  }));

  return { users, count: count || 0 };
};
