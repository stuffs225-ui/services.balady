import type { EmployeeVisitEvent } from '../types/database'

/** Fallback thresholds, used until an admin sets their own values in Settings. */
export const DEFAULT_RAPID_VISIT_THRESHOLD = 3
export const DEFAULT_RAPID_VISIT_WINDOW_MINUTES = 15
export const DEFAULT_DAILY_VISIT_THRESHOLD = 5

export type VisitAlertThresholds = {
  /** More than this many visits within rapidVisitWindowMinutes triggers a "rapid scan" alert. */
  rapidVisitThreshold: number
  rapidVisitWindowMinutes: number
  /** More than this many visits in a day triggers a "high daily count" alert. */
  dailyVisitThreshold: number
}

export const DEFAULT_VISIT_ALERT_THRESHOLDS: VisitAlertThresholds = {
  rapidVisitThreshold: DEFAULT_RAPID_VISIT_THRESHOLD,
  rapidVisitWindowMinutes: DEFAULT_RAPID_VISIT_WINDOW_MINUTES,
  dailyVisitThreshold: DEFAULT_DAILY_VISIT_THRESHOLD,
}

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
 * The largest number of visits that fall within any span of windowMs, via a
 * sliding window over the (already sorted) timestamps.
 */
export function maxVisitsInWindow(sortedTimestamps: number[], windowMs: number): number {
  let windowStart = 0
  let maxCount = 0
  for (let i = 0; i < sortedTimestamps.length; i++) {
    while (sortedTimestamps[i] - sortedTimestamps[windowStart] > windowMs) {
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
 * total alone wouldn't catch if the rest of the day was quiet). Thresholds
 * are admin-configurable (Settings → إعدادات تنبيهات الزيارات), falling
 * back to DEFAULT_VISIT_ALERT_THRESHOLDS.
 */
export function buildVisitAlerts(
  activities: EmployeeActivity[],
  thresholds: VisitAlertThresholds = DEFAULT_VISIT_ALERT_THRESHOLDS,
): VisitAlert[] {
  const alerts: VisitAlert[] = []
  const windowMs = thresholds.rapidVisitWindowMinutes * 60_000

  for (const { employeeId, timestamps } of activities) {
    const burst = maxVisitsInWindow(timestamps, windowMs)
    if (burst > thresholds.rapidVisitThreshold) {
      alerts.push({
        employeeId,
        reason: 'مسح متكرر خلال وقت قصير',
        detail: `${burst} مسحات خلال ${thresholds.rapidVisitWindowMinutes} دقيقة`,
        priority: 2,
      })
    }

    if (timestamps.length > thresholds.dailyVisitThreshold) {
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

export type DailyVisitAlert = VisitAlert & {
  /** Calendar day the alert applies to, as a stable "YYYY-MM-DD" key (local time). */
  dateKey: string
}

/**
 * Same alert logic as buildVisitAlerts, but evaluated separately per
 * calendar day across every event given (not just "today") — a log the
 * admin can look back through, instead of one that only ever shows what's
 * happening right now. Nothing is persisted anywhere: a day's entry is
 * simply recomputed from that day's actual events every time this runs, so
 * if more visits land on today's date before the next reload, today's
 * entry reflects the new total automatically.
 */
export function buildVisitAlertsLog(
  events: EmployeeVisitEvent[],
  thresholds: VisitAlertThresholds = DEFAULT_VISIT_ALERT_THRESHOLDS,
): DailyVisitAlert[] {
  const eventsByDay = new Map<string, EmployeeVisitEvent[]>()
  for (const event of events) {
    const dateKey = new Date(event.visited_at).toLocaleDateString('en-CA') // YYYY-MM-DD, a stable grouping key
    const existing = eventsByDay.get(dateKey)
    if (existing) existing.push(event)
    else eventsByDay.set(dateKey, [event])
  }

  const log: DailyVisitAlert[] = []
  for (const [dateKey, dayEvents] of eventsByDay) {
    const activities = groupVisitsByEmployee(dayEvents)
    for (const alert of buildVisitAlerts(activities, thresholds)) {
      log.push({ ...alert, dateKey })
    }
  }

  return log.sort((a, b) => b.dateKey.localeCompare(a.dateKey) || b.priority - a.priority)
}
