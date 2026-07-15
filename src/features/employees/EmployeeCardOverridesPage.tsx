import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeById, updateEmployeeCardOverrides } from './api'
import EmployeeCardRenderer, {
  fieldValue,
  type TextFieldKey,
} from '../../components/card/EmployeeCardRenderer'
import { useSiteSettings } from '../settings/useSiteSettings'
import {
  EMPLOYEE_CARD_TEXT_FIELD_ORDER,
  EMPLOYEE_CARD_FIELD_LABELS,
} from '../../config/employeeCardLayout'
import { getEmployeePublicUrl } from '../../lib/publicUrl'
import type { Employee, EmployeeCardOverrides } from '../../types/database'

function EmployeeCardOverridesPage() {
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [overrides, setOverrides] = useState<EmployeeCardOverrides>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const { employeeCardTemplateUrl, employeeCardLayout } = useSiteSettings()

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        const data = await getEmployeeById(id!)
        if (cancelled) return
        if (!data) {
          setLoadError('تعذر العثور على الموظف')
          return
        }
        setEmployee(data)
        setOverrides(data.employee_card_overrides ?? {})
      } catch {
        if (!cancelled) setLoadError('تعذر تحميل بيانات الموظف، يرجى تحديث الصفحة')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  function updateOverride(field: TextFieldKey, patch: { fontSize?: number; text?: string }) {
    setOverrides((prev) => {
      const merged = { ...prev[field], ...patch }
      const next = { ...prev }
      if (merged.fontSize === undefined && !merged.text) {
        delete next[field]
      } else {
        next[field] = merged
      }
      return next
    })
  }

  function resetField(field: TextFieldKey) {
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleSave() {
    if (!employee) return
    setIsSaving(true)
    setMessage(null)
    try {
      const hasOverrides = Object.keys(overrides).length > 0
      await updateEmployeeCardOverrides(employee.id, hasOverrides ? overrides : null)
      setMessage({ kind: 'success', text: 'تم حفظ إعدادات كرت هذا الموظف' })
    } catch {
      setMessage({ kind: 'error', text: 'تعذر الحفظ، يرجى المحاولة مرة أخرى' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <p className="text-text-secondary">جارٍ التحميل...</p>
  if (loadError) return <p className="text-expired">{loadError}</p>
  if (!employee) return <p className="text-expired">تعذر العثور على الموظف</p>

  const previewEmployee: Employee = { ...employee, employee_card_overrides: overrides }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">تخصيص كرت {employee.employee_name}</h1>
        <Link
          to={`/employees/${employee.id}`}
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
        >
          رجوع لتفاصيل الموظف
        </Link>
      </div>

      <p className="mb-6 text-sm text-text-secondary">
        هذه الإعدادات خاصة بهذا الموظف فقط ولا تؤثر على كرت أي موظف آخر — استخدمها لحالة استثنائية
        تحتاج حجم خط مختلف أو نصًا مختلفًا عن باقي الكروت.
      </p>

      {message && (
        <p
          className={`mb-6 rounded-field px-4 py-3 text-sm font-bold ${
            message.kind === 'success'
              ? 'bg-brand-primary-soft/20 text-brand-primary'
              : 'bg-red-50 text-expired'
          }`}
        >
          {message.text}
        </p>
      )}

      {employeeCardTemplateUrl ? (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="max-w-xl flex-1">
            <EmployeeCardRenderer
              templateUrl={employeeCardTemplateUrl}
              employee={previewEmployee}
              publicUrl={getEmployeePublicUrl(employee.public_token)}
              layout={employeeCardLayout}
            />
          </div>

          <div className="w-full shrink-0 rounded-field border border-divider p-4 lg:w-96">
            <h2 className="mb-3 text-sm font-bold text-heading">الحقول</h2>
            <ul className="flex flex-col gap-4">
              {EMPLOYEE_CARD_TEXT_FIELD_ORDER.map((field) => {
                const fieldOverride = overrides[field]
                const defaultText = fieldValue(employee, field)
                const hasOverride = Boolean(fieldOverride)

                return (
                  <li key={field} className="border-b border-divider pb-4 last:border-0 last:pb-0">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-text-primary">
                        {EMPLOYEE_CARD_FIELD_LABELS[field]}
                      </p>
                      {hasOverride && (
                        <button
                          type="button"
                          onClick={() => resetField(field)}
                          className="text-xs font-bold text-expired hover:underline"
                        >
                          إعادة تعيين
                        </button>
                      )}
                    </div>

                    <label className="mb-2 block text-xs font-bold text-text-secondary">
                      حجم الخط
                      <input
                        type="number"
                        min={6}
                        max={80}
                        placeholder={String(employeeCardLayout[field].fontSize)}
                        value={fieldOverride?.fontSize ?? ''}
                        onChange={(event) => {
                          const raw = event.target.value
                          updateOverride(field, {
                            fontSize: raw === '' ? undefined : Number(raw),
                          })
                        }}
                        className="mt-1 w-full rounded-field border border-input-border bg-input-bg px-2 py-1 text-sm"
                      />
                    </label>

                    <label className="block text-xs font-bold text-text-secondary">
                      النص المعروض
                      <input
                        type="text"
                        placeholder={defaultText}
                        value={fieldOverride?.text ?? ''}
                        onChange={(event) => updateOverride(field, { text: event.target.value })}
                        className="mt-1 w-full rounded-field border border-input-border bg-input-bg px-2 py-1 text-sm"
                        dir="auto"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 w-full rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60"
            >
              {isSaving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          لم يتم رفع قالب بطاقة بعد. يمكن للمشرف رفعه من الإعدادات ← قالب بطاقة الموظف.
        </p>
      )}
    </div>
  )
}

export default EmployeeCardOverridesPage
