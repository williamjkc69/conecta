import { supabase } from "@/lib/supabase";

export interface AdminCompany {
  id: string;
  company_name: string;
  email: string;
  interviews_count: number;
  created_at: string;
}

export const fetchAdminCompanies = async ({
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

  let query = supabase.from("companies").select("*", { count: "exact" });

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
  }

  const { data, count, error } = await query
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }

  const users: AdminCompany[] = (data || []).map((company) => ({
    id: company.id,
    company_name: company.name, // Map name to company_name
    email: company.email,
    interviews_count: 0, // Aggregation expensive without view
    created_at: company.created_at
  }));

  return { users, count: count || 0 };
};
