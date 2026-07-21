import type { Employee } from '../types/database'

/**
 * An employee's "registration date" for admin-facing lists/reports: the
 * last time they were reactivated after being deactivated, or their
 * original signup date if that's never happened. A reactivated employee
 * is meant to show up as newly registered on the day they came back, not
 * buried under their original signup day.
 */
export function getEmployeeRegistrationDate(employee: Employee): string {
  return employee.reactivated_at ?? employee.created_at
}

/**
 * Formats a date in Arabic with the Gregorian calendar and Latin digits —
 * e.g. "21/7/2026". The Gregorian calendar is forced explicitly (rather
 * than left to the "ar-SA" locale default) since that locale's default
 * calendar is Hijri on some platforms (notably Safari/iOS), which would
 * otherwise silently show Hijri dates even though every other date in
 * this app is Gregorian. Latin digits match this app's convention of
 * always showing numbers/dates in Latin digits even within Arabic text.
 */
export function formatGregorianDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', options)
}
