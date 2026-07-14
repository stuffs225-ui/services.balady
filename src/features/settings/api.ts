import { supabase, BRANDING_ASSETS_BUCKET, SITE_SETTINGS_ID } from '../../lib/supabase'
import type { SiteSettings, SiteSettingsUpdate } from '../../types/database'

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', SITE_SETTINGS_ID)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateSiteSettings(update: SiteSettingsUpdate): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .update(update)
    .eq('id', SITE_SETTINGS_ID)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Uploads a branding image (logo or footer badge) and returns its storage path. */
export async function uploadBrandingAsset(file: File, folder: 'logo' | 'badges'): Promise<string> {
  const path = `${folder}/${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage
    .from(BRANDING_ASSETS_BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  return path
}

/** Branding assets live in a public bucket, so this is a plain public URL (no signing). */
export function getBrandingAssetUrl(path: string | null): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(BRANDING_ASSETS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
