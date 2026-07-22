import type { EmployeeVisitEvent } from '../types/database'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

/** More than this many visits in a day is flagged as unusual. */
export const DAILY_VISIT_ALERT_THRESHOLD = 5
/** More than this many visits within any 15-minute window is flagged as unusual. */
export const RAPID_VISIT_ALERT_THRESHOLD = 3

export type EmployeeActivity = {
  employeeId: string
  /** Ascending visit timestamps (ms since epoch). */
  timestamps: number[]
}

/** Groups visit events by employee, with each employee's timestamps sorted oldest first. */
export function groupVisitsByEmployee(events: EmployeeVisitEvent[]): EmployeeActivity[] {
  const byEmployee = new Map<string, number[]>()
  for (const event of events) {
    const timestamp = new Date(event.visited_at).getTime()
    const existing = byEmployee.get(event.employee_id)
    if (existing) existing.push(timestamp)
    else byEmployee.set(event.employee_id, [timestamp])
  }

  const activities: EmployeeActivity[] = []
  for (const [employeeId, timestamps] of byEmployee) {
    timestamps.sort((a, b) => a - b)
    activities.push({ employeeId, timestamps })
  }
  return activities
}

/**
 * The largest number of visits that fall within any 15-minute span, via a
 * sliding window over the (already sorted) timestamps.
 */
export function maxVisitsInFifteenMinutes(sortedTimestamps: number[]): number {
  let windowStart = 0
  let maxCount = 0
  for (let i = 0; i < sortedTimestamps.length; i++) {
    while (sortedTimestamps[i] - sortedTimestamps[windowStart] > FIFTEEN_MINUTES_MS) {
      windowStart++
    }
    maxCount = Math.max(maxCount, i - windowStart + 1)
  }
  return maxCount
}

export type LeaderboardEntry = {
  employeeId: string
  visitCount: number
}

/** Employees ranked by today's visit count, most-visited first. */
export function buildLeaderboard(activities: EmployeeActivity[]): LeaderboardEntry[] {
  return activities
    .map((activity) => ({ employeeId: activity.employeeId, visitCount: activity.timestamps.length }))
    .sort((a, b) => b.visitCount - a.visitCount)
}

export type VisitAlert = {
  employeeId: string
  reason: string
  detail: string
  /** Higher first when sorting — lets a "rapid scan" alert outrank a plain high-count one. */
  priority: number
}

/**
 * Flags employees whose activity today looks abnormal: an unusually high
 * total, or a burst of scans packed into a short window (which a daily
 * total alone wouldn't catch if the rest of the day was quiet).
 */
export function buildVisitAlerts(activities: EmployeeActivity[]): VisitAlert[] {
  const alerts: VisitAlert[] = []

  for (const { employeeId, timestamps } of activities) {
    const burst = maxVisitsInFifteenMinutes(timestamps)
    if (burst > RAPID_VISIT_ALERT_THRESHOLD) {
      alerts.push({
        employeeId,
        reason: 'مسح متكرر خلال وقت قصير',
        detail: `${burst} مسحات خلال ربع ساعة`,
        priority: 2,
      })
    }

    if (timestamps.length > DAILY_VISIT_ALERT_THRESHOLD) {
      alerts.push({
        employeeId,
        reason: 'عدد زيارات مرتفع اليوم',
        detail: `${timestamps.length} زيارات اليوم`,
        priority: 1,
      })
    }
  }

  return alerts.sort((a, b) => b.priority - a.priority)
}
