import { createClient } from '@supabase/supabase-js'

// READ the new environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key. Check Vercel environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey)