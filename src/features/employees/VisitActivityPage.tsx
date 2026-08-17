import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listVisitEventsSince, getEmployeeVisitSummaries, type EmployeeVisitSummary } from './api'
import { getSiteSettings } from '../settings/api'
import { startOfDaysAgoIso } from '../../lib/dates'
import { formatGregorianDate } from '../../lib/employeeRegistrationDate'
import {
  groupVisitsByEmployee,
  buildLeaderboard,
  buildVisitAlertsLog,
  DEFAULT_VISIT_ALERT_THRESHOLDS,
  type DailyVisitAlert,
  type VisitAlertThresholds,
} from '../../lib/visitActivity'

const TOP_LEADERBOARD_SIZE = 5
/** How far back the alerts log looks — a bounded window keeps the query and table from growing forever. */
const ALERTS_LOG_WINDOW_DAYS = 30

type LoggedAlert = { displayDate: string; employee: EmployeeVisitSummary; alert: DailyVisitAlert }

type ViewState = {
  leaderboard: { employee: EmployeeVisitSummary; visitCount: number }[]
  alertsLog: LoggedAlert[]
  thresholds: VisitAlertThresholds
}

/** "YYYY-MM-DD" day key → a short readable date, e.g. "22/07/2026". */
function displayDateForDayKey(dateKey: string): string {
  return formatGregorianDate(new Date(`${dateKey}T12:00:00`), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function severityClasses(priority: number): string {
  return priority >= 2
    ? 'border-expired/30 bg-expired/5 text-expired'
    : 'border-warning/30 bg-warning/5 text-warning'
}

function VisitActivityPage() {
  const [view, setView] = useState<ViewState | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [events, settings] = await Promise.all([
          listVisitEventsSince(startOfDaysAgoIso(ALERTS_LOG_WINDOW_DAYS)),
          getSiteSettings(),
        ])
        const thresholds: VisitAlertThresholds = {
          rapidVisitThreshold:
            settings?.visit_alert_rapid_threshold ?? DEFAULT_VISIT_ALERT_THRESHOLDS.rapidVisitThreshold,
          rapidVisitWindowMinutes:
            settings?.visit_alert_rapid_window_minutes ??
            DEFAULT_VISIT_ALERT_THRESHOLDS.rapidVisitWindowMinutes,
          dailyVisitThreshold:
            settings?.visit_alert_daily_threshold ?? DEFAULT_VISIT_ALERT_THRESHOLDS.dailyVisitThreshold,
        }

        const employeeIds = Array.from(new Set(events.map((event) => event.employee_id)))
        const summaries = await getEmployeeVisitSummaries(employeeIds)
        const summaryById = new Map(summaries.map((summary) => [summary.id, summary]))

        // The leaderboard only ever looks at today, regardless of how far
        // back the alerts log below reaches.
        const todayKey = new Date().toLocaleDateString('en-CA')
        const todaysEvents = events.filter(
          (event) => new Date(event.visited_at).toLocaleDateString('en-CA') === todayKey,
        )
        const leaderboard = buildLeaderboard(groupVisitsByEmployee(todaysEvents))
          .slice(0, TOP_LEADERBOARD_SIZE)
          .flatMap((entry) => {
            const employee = summaryById.get(entry.employeeId)
            return employee ? [{ employee, visitCount: entry.visitCount }] : []
          })

        const alertsLog = buildVisitAlertsLog(events, thresholds).flatMap((alert) => {
          const employee = summaryById.get(alert.employeeId)
          return employee
            ? [{ employee, alert, displayDate: displayDateForDayKey(alert.dateKey) }]
            : []
        })

        if (!cancelled) {
          setView({ leaderboard, alertsLog, thresholds })
        }
      } catch {
        if (!cancelled) setLoadError('تعذر تحميل نشاط الزيارات، يرجى تحديث الصفحة')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">متابعة زيارات اليوم</h1>
        <Link
          to="/employees"
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
        >
          رجوع
        </Link>
      </div>

      {loadError && <p className="text-expired">{loadError}</p>}
      {!loadError && !view && <p className="text-text-secondary">جارٍ التحميل...</p>}

      {view && (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 font-bold text-heading">الأكثر زيارة اليوم</h2>
            {view.leaderboard.length === 0 ? (
              <p className="rounded-field border border-divider p-4 text-text-secondary">
                لا توجد زيارات مسجّلة اليوم بعد
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {view.leaderboard.map(({ employee, visitCount }, index) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-4 rounded-field border border-divider p-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-heading">{employee.employee_name}</p>
                      <p className="text-xs text-text-secondary">
                        {employee.certificate_number} · {employee.profession}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold text-text-secondary">
                      {visitCount} {visitCount === 1 ? 'زيارة' : 'زيارات'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-bold text-heading">سجل التنبيهات (آخر {ALERTS_LOG_WINDOW_DAYS} يومًا)</h2>
              <p className="text-xs text-text-secondary">
                أكثر من {view.thresholds.rapidVisitThreshold} مسحات خلال {view.thresholds.rapidVisitWindowMinutes} دقيقة،
                أو أكثر من {view.thresholds.dailyVisitThreshold} مسحات في نفس اليوم ·{' '}
                <Link to="/settings" className="font-bold text-brand-primary hover:underline">
                  تعديل الحدود من الإعدادات
                </Link>
              </p>
            </div>
            {view.alertsLog.length === 0 ? (
              <p className="rounded-field border border-divider p-4 text-text-secondary">
                لا توجد تنبيهات مسجّلة خلال هذه الفترة
              </p>
            ) : (
              <div className="overflow-x-auto rounded-field border border-divider">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-divider bg-surface-muted text-text-secondary">
                      <th className="px-4 py-2 font-bold">التاريخ</th>
                      <th className="px-4 py-2 font-bold">الموظف</th>
                      <th className="px-4 py-2 font-bold">رقم الهوية</th>
                      <th className="px-4 py-2 font-bold">سبب التنبيه</th>
                      <th className="px-4 py-2 font-bold">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.alertsLog.map(({ employee, alert, displayDate }, index) => (
                      <tr key={`${employee.id}-${alert.dateKey}-${index}`} className="border-t border-divider">
                        <td dir="ltr" className="px-4 py-2 text-right text-text-secondary">
                          {displayDate}
                        </td>
                        <td className="px-4 py-2 font-bold text-heading">{employee.employee_name}</td>
                        <td dir="ltr" className="px-4 py-2 text-right text-text-secondary">
                          {employee.identity_number}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClasses(alert.priority)}`}
                          >
                            {alert.reason}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-text-secondary">{alert.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default VisitActivityPage
