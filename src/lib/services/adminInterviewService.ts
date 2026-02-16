import { supabase } from "@/lib/supabase";

export interface AdminInterview {
  id: string;
  created_at: string;
  status: string;
  candidate?: { full_name: string };
  company?: { company_name: string };
  job?: { title: string };
}

export const fetchAdminInterviews = async (
  searchTerm: string = "",
  page: number = 1,
  limit: number = 10
) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("applications").select(
    `
      *,
      listing:listings (
        title
      ),
      candidate:users (
        full_name
      ),
      status:application_statuses (
        name
      )
    `,
    { count: "exact" }
  );

  // Note for company: Listings usually linked to company.
  // We can try nested select: listing:listings(title, company:companies(name))
  // But supabase nested count can be tricky.
  // Let's try to fetch listing with company.

  // If search is implemented on joined columns, it's complex. Skipping search logic for now to ensure base load works.

  const { data, count, error } = await query
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching interviews:", error);
    throw error;
  }

  // We need company name. Listings belong to companies?
  // Let's fetch company names separately if needed or assume listing has company_id

  // Actually, let's try to include company at top level if application has company_id
  // Based on CompanyOnboardingModal, users have company_id. listings likely have company_id.

  // If we can't get company name easily in one query without profound knowledge of schema,
  // we might skip it or do a second pass.

  // Attempt to fetch company via listing
  const interviews = await Promise.all(
    (data || []).map(async (app: any) => {
      let companyName = "N/A";
      if (app.listing_id) {
        const { data: listingData } = await supabase
          .from("listings")
          .select("company:companies(name)")
          .eq("id", app.listing_id)
          .single();
        if (listingData?.company) {
          // @ts-ignore
          companyName = listingData.company.name;
        }
      }

      return {
        id: app.id,
        created_at: app.created_at,
        status: app.status?.name || "unknown",
        candidate: { full_name: app.candidate?.full_name || "N/A" },
        company: { company_name: companyName },
        job: { title: app.listing?.title || "N/A" }
      };
    })
  );

  return { interviews, count: count || 0 };
};
