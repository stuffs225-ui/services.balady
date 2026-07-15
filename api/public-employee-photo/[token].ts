import { createClient } from '@supabase/supabase-js'

// Runs on Vercel's Edge Network, same-origin with the app itself — the
// public page never talks to Supabase Storage directly, so there's no
// signed URL, Blob URL, or cross-origin request for an in-app browser to
// mishandle.
export const config = { runtime: 'edge' }

const EMPLOYEE_PHOTOS_BUCKET = 'employee-photos'
const MIN_TOKEN_LENGTH = 8

function notFound(): Response {
  return new Response('Not found', { status: 404 })
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const token = url.pathname.split('/').filter(Boolean).pop()

  if (!token || token.length < MIN_TOKEN_LENGTH) {
    return notFound()
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Server misconfigured', { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { data: employee } = await supabase
    .from('employees')
    .select('employee_photo_path, is_active')
    .eq('public_token', token)
    .maybeSingle()

  if (!employee || !employee.is_active || !employee.employee_photo_path) {
    return notFound()
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .download(employee.employee_photo_path)

  if (downloadError || !file) {
    return notFound()
  }

  return new Response(file, {
    status: 200,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
