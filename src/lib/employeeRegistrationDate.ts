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
