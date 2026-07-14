import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file. See .env.example.',
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
