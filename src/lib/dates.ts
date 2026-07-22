export const CERTIFICATE_VALIDITY_DAYS = 365
/** Educational program completion date = issue date + this many days. */
export const PROGRAM_VALIDITY_DAYS = 1095

/**
 * Normalizes a Gregorian date-only value to the canonical storage shape
 * "YYYY-MM-DD". Accepts either that shape as-is, or the "YYYY/MM/DD"
 * display shape (converted to dashes). Anything else — including a
 * localized string like "Jul 15 2026" — returns "" rather than guessing,
 * since that can't be converted unambiguously.
 */
export function normalizeDateOnly(value?: string | null): string {
  if (!value) return ''

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return value

  const slash = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (slash) {
    return `${slash[1]}-${slash[2]}-${slash[3]}`
  }

  return ''
}

/** Displays a stored date-only value ("YYYY-MM-DD" or "YYYY/MM/DD") as "YYYY/MM/DD". */
export function displayDateOnly(value?: string | null): string {
  const normalized = normalizeDateOnly(value)
  if (!normalized) return '–'

  const [year, month, day] = normalized.split('-')
  return `${year}/${month}/${day}`
}

/**
 * Today's date in the canonical "YYYY-MM-DD" storage shape, read from
 * local date parts (never toISOString().slice(0, 10), which converts to
 * UTC first and can shift the date by a day near midnight).
 */
export function todayDateOnly(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** Local midnight for today, as an ISO timestamp — a query lower bound for "since the start of today". */
export function startOfTodayIso(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso)
  if (!date) return ''
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** Converts a Gregorian ISO date to a Hijri date string (Umm al-Qura calendar). */
export function gregorianToHijri(gregorianISO: string): string {
  const date = parseISODate(gregorianISO)
  if (!date) return ''

  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  const year = get('year')
  const month = get('month')
  const day = get('day')
  if (!year || !month || !day) return ''

  return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`
}

function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseISODate(iso: string): Date | null {
  if (!iso) return null
  // Anchor at local noon so the date doesn't shift a day when the local
  // timezone offset is applied to a midnight-UTC parse.
  const date = new Date(`${iso}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}
