import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file. See .env.example.',
  )
}

// Only the publishable (anon) key belongs here. The service role key must
// never be referenced in frontend code.
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)

export const EMPLOYEE_PHOTOS_BUCKET = 'employee-photos'
export const BRANDING_ASSETS_BUCKET = 'branding-assets'
export const EMPLOYEE_CARD_TEMPLATE_BUCKET = 'employee-card-template'
export const SITE_SETTINGS_ID = '00000000-0000-0000-0000-000000000001'
