import { supabase, EMPLOYEE_PHOTOS_BUCKET } from '../../lib/supabase'
import { generatePublicToken } from '../../lib/token'
import { normalizeDateOnly } from '../../lib/dates'
import { normalizePhotoCrop } from '../../lib/photoCrop'
import type { Employee, EmployeeInsert, EmployeeUpdate } from '../../types/database'
import type { EmployeeFormValues } from '../../lib/employeeSchema'

/**
 * Defense-in-depth: the form only ever produces a real "YYYY-MM-DD" value
 * for these fields (or blocks submission via schema validation), but never
 * write anything else to Supabase even if that assumption is ever broken
 * upstream.
 */
function requireDateOnly(value: string, label: string): string {
  const normalized = normalizeDateOnly(value)
  if (!normalized) throw new Error(`${label} غير صالح`)
  return normalized
}

export type EmployeeSearchParams = {
  query?: string
}

export async function listEmployees({ query }: EmployeeSearchParams = {}): Promise<Employee[]> {
  let request = supabase.from('employees').select('*').order('created_at', { ascending: false })

  if (query && query.trim()) {
    const term = `%${query.trim()}%`
    request = request.or(
      `employee_name.ilike.${term},certificate_number.ilike.${term},establishment_name.ilike.${term}`,
    )
  }

  const { data, error } = await request
  if (error) throw error
  return data ?? []
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

function photoPathForToken(token: string): string {
  return `${token}/photo`
}

async function uploadEmployeePhoto(token: string, file: File): Promise<string> {
  const path = photoPathForToken(token)
  const { error } = await supabase.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return path
}

export async function getEmployeePhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .createSignedUrl(path, 60 * 5)
  if (error) return null
  return data.signedUrl
}

function toInsertPayload(values: EmployeeFormValues, token: string): EmployeeInsert {
  return {
    public_token: token,
    employee_name: values.employeeName,
    identity_number: values.identityNumber,
    gender: values.gender,
    nationality: values.nationality,
    profession: values.profession,
    authority_name: values.authorityName,
    municipality_name: values.municipalityName,
    certificate_number: values.certificateNumber,
    license_number: values.licenseNumber || null,
    establishment_name: values.establishmentName,
    establishment_number: values.establishmentNumber || null,
    program_type: values.programType || null,
    issue_date_hijri: values.issueDateHijri || null,
    issue_date_gregorian: requireDateOnly(values.issueDateGregorian, 'تاريخ إصدار الشهادة الصحية ميلادي'),
    expiry_date_hijri: values.expiryDateHijri || null,
    expiry_date_gregorian: requireDateOnly(values.expiryDateGregorian, 'تاريخ نهاية الشهادة الصحية ميلادي'),
    program_completion_date_hijri: values.programCompletionDateHijri || null,
    employee_photo_path: null,
    employee_photo_crop: normalizePhotoCrop(values.employeePhotoCrop),
    is_active: true,
  }
}

export async function createEmployee(values: EmployeeFormValues): Promise<Employee> {
  const token = generatePublicToken()
  let photoPath: string | null = null

  if (values.employeePhoto) {
    photoPath = await uploadEmployeePhoto(token, values.employeePhoto)
  }

  const payload = { ...toInsertPayload(values, token), employee_photo_path: photoPath }

  const { data, error } = await supabase.from('employees').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateEmployee(
  id: string,
  publicToken: string,
  currentPhotoPath: string | null,
  values: EmployeeFormValues,
): Promise<Employee> {
  let photoPath = currentPhotoPath

  if (values.employeePhoto) {
    photoPath = await uploadEmployeePhoto(publicToken, values.employeePhoto)
  }

  const update: EmployeeUpdate = {
    employee_name: values.employeeName,
    identity_number: values.identityNumber,
    gender: values.gender,
    nationality: values.nationality,
    profession: values.profession,
    authority_name: values.authorityName,
    municipality_name: values.municipalityName,
    certificate_number: values.certificateNumber,
    license_number: values.licenseNumber || null,
    establishment_name: values.establishmentName,
    establishment_number: values.establishmentNumber || null,
    program_type: values.programType || null,
    issue_date_hijri: values.issueDateHijri || null,
    issue_date_gregorian: requireDateOnly(values.issueDateGregorian, 'تاريخ إصدار الشهادة الصحية ميلادي'),
    expiry_date_hijri: values.expiryDateHijri || null,
    expiry_date_gregorian: requireDateOnly(values.expiryDateGregorian, 'تاريخ نهاية الشهادة الصحية ميلادي'),
    program_completion_date_hijri: values.programCompletionDateHijri || null,
    employee_photo_path: photoPath,
    employee_photo_crop: normalizePhotoCrop(values.employeePhotoCrop),
  }

  const { data, error } = await supabase
    .from('employees')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deactivateEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

/** Fields the admin repeats often across employees, offered as a pick-list of prior values. */
export const SUGGESTABLE_EMPLOYEE_FIELDS = [
  'authorityName',
  'municipalityName',
  'profession',
  'programType',
  'programCompletionDateHijri',
  'licenseNumber',
  'establishmentName',
  'establishmentNumber',
] as const

export type EmployeeSuggestionField = (typeof SUGGESTABLE_EMPLOYEE_FIELDS)[number]

const SUGGESTION_COLUMN_MAP: Record<EmployeeSuggestionField, string> = {
  authorityName: 'authority_name',
  municipalityName: 'municipality_name',
  profession: 'profession',
  programType: 'program_type',
  programCompletionDateHijri: 'program_completion_date_hijri',
  licenseNumber: 'license_number',
  establishmentName: 'establishment_name',
  establishmentNumber: 'establishment_number',
}

export async function getEmployeeFieldSuggestions(): Promise<
  Record<EmployeeSuggestionField, string[]>
> {
  const columns = Object.values(SUGGESTION_COLUMN_MAP)
  const { data, error } = await supabase.from('employees').select(columns.join(','))
  if (error) throw error

  const rows = (data ?? []) as unknown as Array<Record<string, string | null>>
  const result = {} as Record<EmployeeSuggestionField, string[]>

  for (const field of SUGGESTABLE_EMPLOYEE_FIELDS) {
    const column = SUGGESTION_COLUMN_MAP[field]
    const values = new Set<string>()
    for (const row of rows) {
      const value = row[column]
      if (value) values.add(value)
    }
    result[field] = Array.from(values).sort((a, b) => a.localeCompare(b, 'ar'))
  }

  return result
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}
