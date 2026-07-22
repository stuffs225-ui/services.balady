import { describe, expect, it } from 'vitest'
import {
  groupVisitsByEmployee,
  maxVisitsInFifteenMinutes,
  buildLeaderboard,
  buildVisitAlerts,
} from './visitActivity'
import type { EmployeeVisitEvent } from '../types/database'

function makeEvent(employeeId: string, isoTimestamp: string): EmployeeVisitEvent {
  return { id: `${employeeId}-${isoTimestamp}`, employee_id: employeeId, visited_at: isoTimestamp }
}

describe('groupVisitsByEmployee', () => {
  it('groups events by employee id with timestamps sorted oldest first', () => {
    const events = [
      makeEvent('emp-1', '2026-07-22T10:00:00Z'),
      makeEvent('emp-2', '2026-07-22T09:00:00Z'),
      makeEvent('emp-1', '2026-07-22T08:00:00Z'),
    ]

    const activities = groupVisitsByEmployee(events)
    const emp1 = activities.find((activity) => activity.employeeId === 'emp-1')!
    expect(emp1.timestamps).toEqual([
      new Date('2026-07-22T08:00:00Z').getTime(),
      new Date('2026-07-22T10:00:00Z').getTime(),
    ])
    expect(activities.find((activity) => activity.employeeId === 'emp-2')!.timestamps).toHaveLength(1)
  })
})

describe('maxVisitsInFifteenMinutes', () => {
  it('returns 0 for no timestamps', () => {
    expect(maxVisitsInFifteenMinutes([])).toBe(0)
  })

  it('counts a burst of visits packed within 15 minutes', () => {
    const base = new Date('2026-07-22T10:00:00Z').getTime()
    const timestamps = [base, base + 5 * 60_000, base + 10 * 60_000, base + 14 * 60_000]
    expect(maxVisitsInFifteenMinutes(timestamps)).toBe(4)
  })

  it('does not count visits spread more than 15 minutes apart as one burst', () => {
    const base = new Date('2026-07-22T10:00:00Z').getTime()
    const timestamps = [base, base + 20 * 60_000, base + 40 * 60_000]
    expect(maxVisitsInFifteenMinutes(timestamps)).toBe(1)
  })
})

describe('buildLeaderboard', () => {
  it('ranks employees by visit count, most-visited first', () => {
    const activities = groupVisitsByEmployee([
      makeEvent('emp-quiet', '2026-07-22T09:00:00Z'),
      makeEvent('emp-busy', '2026-07-22T09:00:00Z'),
      makeEvent('emp-busy', '2026-07-22T09:05:00Z'),
      makeEvent('emp-busy', '2026-07-22T09:10:00Z'),
    ])

    const leaderboard = buildLeaderboard(activities)
    expect(leaderboard[0]).toEqual({ employeeId: 'emp-busy', visitCount: 3 })
    expect(leaderboard[1]).toEqual({ employeeId: 'emp-quiet', visitCount: 1 })
  })
})

describe('buildVisitAlerts', () => {
  it('flags an employee with more than 5 visits today', () => {
    const events: EmployeeVisitEvent[] = []
    for (let i = 0; i < 6; i++) {
      events.push(makeEvent('emp-1', `2026-07-22T0${i}:00:00Z`))
    }
    const alerts = buildVisitAlerts(groupVisitsByEmployee(events))

    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      employeeId: 'emp-1',
      reason: 'عدد زيارات مرتفع اليوم',
      detail: '6 زيارات اليوم',
    })
  })

  it('does not flag exactly 5 visits (the boundary is "more than 5")', () => {
    const events: EmployeeVisitEvent[] = []
    for (let i = 0; i < 5; i++) {
      events.push(makeEvent('emp-1', `2026-07-22T0${i}:00:00Z`))
    }
    expect(buildVisitAlerts(groupVisitsByEmployee(events))).toHaveLength(0)
  })

  it('flags an employee with more than 3 visits within 15 minutes', () => {
    const base = '2026-07-22T10:00:00.000Z'
    const baseMs = new Date(base).getTime()
    const events = [0, 1, 2, 3].map((i) => makeEvent('emp-1', new Date(baseMs + i * 60_000).toISOString()))

    const alerts = buildVisitAlerts(groupVisitsByEmployee(events))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      employeeId: 'emp-1',
      reason: 'مسح متكرر خلال وقت قصير',
      detail: '4 مسحات خلال ربع ساعة',
    })
  })

  it('does not flag exactly 3 visits within 15 minutes (the boundary is "more than 3")', () => {
    const baseMs = new Date('2026-07-22T10:00:00.000Z').getTime()
    const events = [0, 1, 2].map((i) => makeEvent('emp-1', new Date(baseMs + i * 60_000).toISOString()))
    expect(buildVisitAlerts(groupVisitsByEmployee(events))).toHaveLength(0)
  })

  it('can raise both alerts for the same employee, rapid-scan sorted first', () => {
    const baseMs = new Date('2026-07-22T10:00:00.000Z').getTime()
    const burstEvents = [0, 1, 2, 3].map((i) =>
      makeEvent('emp-1', new Date(baseMs + i * 60_000).toISOString()),
    )
    const laterEvents = [1, 2, 3].map((h) => makeEvent('emp-1', `2026-07-22T${12 + h}:00:00Z`))

    const alerts = buildVisitAlerts(groupVisitsByEmployee([...burstEvents, ...laterEvents]))

    expect(alerts).toHaveLength(2)
    expect(alerts[0].reason).toBe('مسح متكرر خلال وقت قصير')
    expect(alerts[1].reason).toBe('عدد زيارات مرتفع اليوم')
  })

  it('does not flag an employee with normal activity', () => {
    const events = [
      makeEvent('emp-1', '2026-07-22T09:00:00Z'),
      makeEvent('emp-1', '2026-07-22T13:00:00Z'),
    ]
    expect(buildVisitAlerts(groupVisitsByEmployee(events))).toHaveLength(0)
  })
})
