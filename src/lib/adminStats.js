import { supabase } from '@/lib/customSupabaseClient';

export async function fetchUsersWithStats({ role, searchTerm = '', page = 1, limit = 10 }) {
  const { data, error } = await supabase.functions.invoke('get-users-with-stats', {
    body: { role, searchTerm, page, limit },
  });

  if (error) {
    let errorMessage = "Error fetching users with stats.";
    try {
        const errorContext = await error.context.json();
        errorMessage = errorContext.error || errorMessage;
    } catch (parseError) {
        console.error("Could not parse error context:", parseError);
        errorMessage = error.message;
    }
    console.error('Error invoking get-users-with-stats:', errorMessage);
    throw new Error(errorMessage);
  }

  return data;
}