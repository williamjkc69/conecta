import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylibpukesgjdjqllzoep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaWJwdWtlc2dqZGpxbGx6b2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDk5MTQsImV4cCI6MjA3NzQ4NTkxNH0.BCBt_Qwz6WG5ndyIJmk6sLqj7BEZ3ELPzZHTkWRT0aY';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
