import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmployeeCardRenderer from '../../components/card/EmployeeCardRenderer'
import {
  getSiteSettings,
  getEmployeeCardTemplateUrl,
  uploadEmployeeCardTemplate,
  updateSiteSettings,
} from './api'
import {
  defaultEmployeeCardLayout,
  mergeEmployeeCardLayout,
  EMPLOYEE_CARD_FIELD_LABELS,
  EMPLOYEE_CARD_TEXT_FIELD_ORDER,
} from '../../config/employeeCardLayout'
import type { Employee, EmployeeCardLayout, EmployeeCardTextBox } from '../../types/database'

/** Fictional preview data — never real employee information. */
const PREVIEW_EMPLOYEE: Employee = {
  id: 'preview',
  public_token: 'preview-token',
  employee_name: 'اسم تجريبي للمعاينة',
  identity_number: '1000000000',
  gender: 'ذكر',
  nationality: 'الجنسية التجريبية',
  profession: 'مهنة تجريبية',
  authority_name: 'أمانة تجريبية',
  municipality_name: 'بلدية تجريبية',
  certificate_number: 'CERT-DEMO-0000',
  license_number: null,
  establishment_name: 'منشأة تجريبية',
  establishment_number: null,
  program_type: 'برنامج تجريبي',
  issue_date_hijri: '1448/01/15',
  issue_date_gregorian: '2026-06-30',
  expiry_date_hijri: '1449/01/25',
  expiry_date_gregorian: '2027-06-30',
  program_completion_date_hijri: '1450/01/01',
  employee_photo_path: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
const PREVIEW_PUBLIC_URL = 'https://example-demo.test/e/preview-token'

function EmployeeCardTemplatePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const [templatePath, setTemplatePath] = useState<string | null>(null)
  const [templateUrl, setTemplateUrl] = useState<string | null>(null)
  const [layout, setLayout] = useState<EmployeeCardLayout>(defaultEmployeeCardLayout)

  const [calibrationMode, setCalibrationMode] = useState(false)
  const [selectedField, setSelectedField] = useState<keyof EmployeeCardLayout | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const settings = await getSiteSettings()
      if (cancelled) return
      setTemplatePath(settings?.employee_card_template_path ?? null)
      setTemplateUrl(getEmployeeCardTemplateUrl(settings?.employee_card_template_path ?? null))
      setLayout(mergeEmployeeCardLayout(settings?.employee_card_layout))
      setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setMessage(null)
    setIsSaving(true)
    try {
      const path = await uploadEmployeeCardTemplate(file)
      await updateSiteSettings({ employee_card_template_path: path })
      setTemplatePath(path)
      setTemplateUrl(getEmployeeCardTemplateUrl(path))
      setMessage({ kind: 'success', text: 'تم رفع قالب البطاقة بنجاح' })
    } catch {
      setMessage({ kind: 'error', text: 'تعذر رفع قالب البطاقة، يرجى المحاولة مرة أخرى' })
    } finally {
      setIsSaving(false)
      event.target.value = ''
    }
  }

  async function handleRemove() {
    setMessage(null)
    setIsSaving(true)
    try {
      await updateSiteSettings({ employee_card_template_path: null })
      setTemplatePath(null)
      setTemplateUrl(null)
      setCalibrationMode(false)
      setMessage({ kind: 'success', text: 'تمت إزالة قالب البطاقة' })
    } catch {
      setMessage({ kind: 'error', text: 'تعذر إزالة قالب البطاقة' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveLayout() {
    setMessage(null)
    setIsSaving(true)
    try {
      await updateSiteSettings({ employee_card_layout: layout })
      setMessage({ kind: 'success', text: 'تم حفظ إعدادات المعايرة' })
    } catch {
      setMessage({ kind: 'error', text: 'تعذر حفظ إعدادات المعايرة' })
    } finally {
      setIsSaving(false)
    }
  }

  function updateSelectedField(patch: Partial<EmployeeCardTextBox>) {
    if (!selectedField || selectedField === 'photo' || selectedField === 'qr') return
    setLayout((prev) => ({
      ...prev,
      [selectedField]: { ...prev[selectedField], ...patch },
    }))
  }

  if (isLoading) {
    return <p className="text-text-secondary">جارٍ التحميل...</p>
  }

  const selectedBox =
    selectedField && selectedField !== 'photo' && selectedField !== 'qr'
      ? layout[selectedField]
      : null

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">قالب بطاقة الموظف</h1>
        <Link
          to="/settings"
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
        >
          رجوع للإعدادات
        </Link>
      </div>

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

      <section className="mb-8 border-b border-divider pb-8">
        <h2 className="mb-4 font-bold text-heading">صورة خلفية البطاقة</h2>
        <p className="mb-4 text-sm text-text-secondary">
          ارفع صورة خلفية فارغة للبطاقة (PNG أو JPG). لا يتم اقتصاص الصورة أو تعديل أبعادها — تُعرض
          كما هي وتوضع البيانات فوقها فقط.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <input type="file" accept="image/png,image/jpeg" onChange={handleUpload} disabled={isSaving} />
          {templatePath && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isSaving}
              className="rounded-button border border-expired px-3 py-2 text-sm text-expired hover:bg-red-50"
            >
              إزالة القالب
            </button>
          )}
        </div>
      </section>

      {templateUrl ? (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-heading">معاينة البطاقة</h2>
            <button
              type="button"
              onClick={() => {
                setCalibrationMode((prev) => !prev)
                setSelectedField(null)
              }}
              className="rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover"
            >
              {calibrationMode ? 'إنهاء وضع المعايرة' : 'فتح وضع المعايرة'}
            </button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="max-w-xl flex-1">
              <EmployeeCardRenderer
                templateUrl={templateUrl}
                employee={PREVIEW_EMPLOYEE}
                publicUrl={PREVIEW_PUBLIC_URL}
                layout={layout}
                calibrationMode={calibrationMode}
                selectedField={selectedField}
                onSelectField={setSelectedField}
                onLayoutChange={setLayout}
              />
            </div>

            {calibrationMode && (
              <div className="w-full shrink-0 rounded-field border border-divider p-4 lg:w-72">
                <h3 className="mb-3 text-sm font-bold text-heading">إعدادات الحقل المحدد</h3>
                {selectedField ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-bold text-text-primary">
                      {EMPLOYEE_CARD_FIELD_LABELS[selectedField]}
                    </p>

                    {selectedBox && (
                      <>
                        <label className="text-xs font-bold text-text-secondary">
                          حجم الخط
                          <input
                            type="number"
                            min={6}
                            max={80}
                            value={selectedBox.fontSize}
                            onChange={(event) =>
                              updateSelectedField({ fontSize: Number(event.target.value) })
                            }
                            className="mt-1 w-full rounded-field border border-input-border bg-input-bg px-2 py-1 text-sm"
                          />
                        </label>

                        <div className="text-xs font-bold text-text-secondary">
                          محاذاة النص
                          <div className="mt-1 flex gap-2">
                            {(['right', 'center', 'left'] as const).map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => updateSelectedField({ align })}
                                className={`flex-1 rounded-button border px-2 py-1 text-xs ${
                                  selectedBox.align === align
                                    ? 'border-brand-primary bg-brand-primary-soft/20 text-brand-primary'
                                    : 'border-divider text-text-secondary'
                                }`}
                              >
                                {align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <p className="text-xs text-text-secondary">
                      يمكنك أيضًا سحب الحقل مباشرة على البطاقة لتغيير موضعه
                      {selectedField === 'photo' || selectedField === 'qr'
                        ? '، واستخدام المقبض في الزاوية لتغيير حجمه.'
                        : '.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary">
                    اضغط على أي حقل داخل البطاقة لتعديل إعداداته، أو اسحبه مباشرة لتغيير موضعه.
                  </p>
                )}

                <ul className="mt-4 flex flex-col gap-1 border-t border-divider pt-3">
                  {EMPLOYEE_CARD_TEXT_FIELD_ORDER.map((field) => (
                    <li key={field}>
                      <button
                        type="button"
                        onClick={() => setSelectedField(field)}
                        className={`w-full rounded-button px-2 py-1 text-right text-xs ${
                          selectedField === field
                            ? 'bg-brand-primary-soft/20 text-brand-primary'
                            : 'text-text-secondary hover:bg-surface-muted'
                        }`}
                      >
                        {EMPLOYEE_CARD_FIELD_LABELS[field]}
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={handleSaveLayout}
                  disabled={isSaving}
                  className="mt-4 w-full rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60"
                >
                  {isSaving ? 'جارٍ الحفظ...' : 'حفظ إعدادات المعايرة'}
                </button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <p className="text-sm text-text-secondary">
          لم يتم رفع قالب بطاقة بعد. ارفع صورة الخلفية أعلاه لبدء المعاينة والمعايرة.
        </p>
      )}
    </div>
  )
}

export default EmployeeCardTemplatePage
