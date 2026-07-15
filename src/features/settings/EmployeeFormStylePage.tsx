import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmployeeForm from '../employees/EmployeeForm'
import { getSiteSettings, updateSiteSettings } from './api'
import {
  EMPLOYEE_FORM_FIELD_LABELS,
  EMPLOYEE_FORM_FIELD_ORDER,
  defaultEmployeeFormFieldStyles,
  mergeEmployeeFormFieldStyles,
} from '../../config/employeeFormFields'
import type {
  EmployeeFormFieldStyles,
  EmployeeFormStylableField,
} from '../../types/database'
import type { EmployeeFormValues } from '../../lib/employeeSchema'

/** Fictional preview data — never real employee information. */
const PREVIEW_VALUES: Partial<EmployeeFormValues> = {
  authorityName: 'أمانة تجريبية',
  municipalityName: 'بلدية تجريبية',
  employeeName: 'اسم تجريبي للمعاينة',
  identityNumber: '1000000000',
  gender: 'ذكر',
  nationality: 'الجنسية التجريبية',
  certificateNumber: 'CERT-DEMO-0000',
  profession: 'مهنة تجريبية',
  issueDateHijri: '1448/01/15',
  issueDateGregorian: '2026-06-30',
  expiryDateHijri: '1449/01/15',
  expiryDateGregorian: '2027-06-30',
  programType: 'برنامج تجريبي',
  programCompletionDateHijri: '1450/01/01',
  licenseNumber: 'LIC-DEMO-0000',
  establishmentName: 'منشأة تجريبية',
  establishmentNumber: 'EST-DEMO-0000',
}

const DIR_OPTIONS: Array<{ value: 'rtl' | 'ltr'; label: string }> = [
  { value: 'rtl', label: 'يمين لليسار (RTL)' },
  { value: 'ltr', label: 'يسار لليمين (LTR)' },
]

const ALIGN_OPTIONS: Array<{ value: 'right' | 'left' | 'center'; label: string }> = [
  { value: 'right', label: 'يمين' },
  { value: 'left', label: 'يسار' },
  { value: 'center', label: 'وسط' },
]

function EmployeeFormStylePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [fieldStyles, setFieldStyles] = useState<EmployeeFormFieldStyles>(
    defaultEmployeeFormFieldStyles,
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const settings = await getSiteSettings()
        if (cancelled) return
        setFieldStyles(mergeEmployeeFormFieldStyles(settings?.employee_form_field_styles))
      } catch {
        if (!cancelled) {
          setMessage({ kind: 'error', text: 'تعذر تحميل الإعدادات، يرجى تحديث الصفحة' })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function updateField(
    field: EmployeeFormStylableField,
    patch: Partial<EmployeeFormFieldStyles[EmployeeFormStylableField]>,
  ) {
    setFieldStyles((prev) => ({ ...prev, [field]: { ...prev[field], ...patch } }))
  }

  function resetToDefaults() {
    setFieldStyles(defaultEmployeeFormFieldStyles)
  }

  async function handleSave() {
    setMessage(null)
    setIsSaving(true)
    try {
      await updateSiteSettings({ employee_form_field_styles: fieldStyles })
      setMessage({ kind: 'success', text: 'تم حفظ إعدادات الفورم بنجاح' })
    } catch {
      setMessage({ kind: 'error', text: 'تعذر حفظ إعدادات الفورم، يرجى المحاولة مرة أخرى' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p className="text-text-secondary">جارٍ التحميل...</p>
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">تنسيق نموذج تسجيل الموظف</h1>
        <Link
          to="/settings"
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
        >
          رجوع للإعدادات
        </Link>
      </div>

      <p className="mb-6 text-sm text-text-secondary">
        حدد اتجاه الكتابة (يمين لليسار / يسار لليمين) ومحاذاة النص (يمين / يسار / وسط) لكل حقل في
        نموذج إضافة/تعديل الموظف، وشاهد النتيجة مباشرة بالمعاينة قبل الحفظ.
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

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-heading">إعدادات الحقول</h2>
            <button
              type="button"
              onClick={resetToDefaults}
              className="rounded-button border border-divider px-3 py-1.5 text-xs font-bold hover:bg-surface-muted"
            >
              إعادة للوضع الافتراضي
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {EMPLOYEE_FORM_FIELD_ORDER.map((field) => {
              const style = fieldStyles[field]
              return (
                <div key={field} className="rounded-field border border-divider p-3">
                  <p className="mb-2 text-sm font-bold text-text-primary">
                    {EMPLOYEE_FORM_FIELD_LABELS[field]}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex gap-2">
                      {DIR_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField(field, { dir: option.value })}
                          className={`rounded-button border px-2 py-1 text-xs ${
                            style.dir === option.value
                              ? 'border-brand-primary bg-brand-primary-soft/20 text-brand-primary'
                              : 'border-divider text-text-secondary'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {ALIGN_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField(field, { align: option.value })}
                          className={`rounded-button border px-2 py-1 text-xs ${
                            style.align === option.value
                              ? 'border-brand-primary bg-brand-primary-soft/20 text-brand-primary'
                              : 'border-divider text-text-secondary'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 w-full rounded-button bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ إعدادات الفورم'}
          </button>
        </div>

        <div className="flex-1">
          <h2 className="mb-4 font-bold text-heading">معاينة مباشرة</h2>
          <div className="rounded-field border border-divider p-4">
            <EmployeeForm
              defaultValues={PREVIEW_VALUES}
              isSubmitting={false}
              submitLabel="حفظ (معاينة فقط)"
              onSubmit={() => {}}
              fieldStylesOverride={fieldStyles}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeFormStylePage
