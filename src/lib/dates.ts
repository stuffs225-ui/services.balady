export const CERTIFICATE_VALIDITY_DAYS = 365

export function todayISO(): string {
  return toISODate(new Date())
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
