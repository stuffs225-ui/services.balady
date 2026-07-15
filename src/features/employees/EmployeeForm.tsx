import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { employeeFormSchema, type EmployeeFormValues } from '../../lib/employeeSchema'
import { displayDateOnly, gregorianToHijri, normalizeDateOnly } from '../../lib/dates'
import {
  DEFAULT_PHOTO_CROP,
  computeCoverDrawRect,
  type EmployeePhotoCrop,
} from '../../lib/photoCrop'
import { getEmployeeFieldSuggestions, type EmployeeSuggestionField } from './api'
import { extractIdCardFields } from '../../lib/idCardOcr'
import PhotoCropModal from './PhotoCropModal'

type TextFieldName = Exclude<keyof EmployeeFormValues, 'employeePhoto' | 'employeePhotoCrop'>

const SUGGESTABLE_FIELDS = new Set<TextFieldName>([
  'authorityName',
  'municipalityName',
  'profession',
  'programType',
  'programCompletionDateHijri',
  'licenseNumber',
  'establishmentName',
  'establishmentNumber',
])

/**
 * Plain Arabic text fields — right-to-left, typed and read the same way as
 * the read-only fields on the employee details/public certificate pages.
 * Every other text field (identity/certificate/license/establishment
 * numbers, Hijri dates) is a digit/code sequence and stays LTR, still
 * anchored to the right of its box — the same convention already used on
 * the public certificate page's field list.
 */
const RTL_TEXT_FIELDS = new Set<TextFieldName>([
  'authorityName',
  'municipalityName',
  'employeeName',
  'gender',
  'nationality',
  'profession',
  'programType',
  'establishmentName',
])

type FieldConfig = {
  name: TextFieldName
  label: string
  type: 'text' | 'dateOnly' | 'select'
  options?: string[]
}

const GREGORIAN_TO_HIJRI: Partial<Record<TextFieldName, TextFieldName>> = {
  issueDateGregorian: 'issueDateHijri',
  expiryDateGregorian: 'expiryDateHijri',
}

const FIELDS: FieldConfig[] = [
  { name: 'authorityName', label: 'الأمانة', type: 'text' },
  { name: 'municipalityName', label: 'البلدية', type: 'text' },
  { name: 'employeeName', label: 'الاسم', type: 'text' },
  { name: 'identityNumber', label: 'رقم الهوية', type: 'text' },
  { name: 'gender', label: 'الجنس', type: 'select', options: ['ذكر', 'أنثى'] },
  { name: 'nationality', label: 'الجنسية', type: 'text' },
  { name: 'certificateNumber', label: 'رقم الشهادة الصحية', type: 'text' },
  { name: 'profession', label: 'المهنة', type: 'text' },
  { name: 'issueDateHijri', label: 'تاريخ إصدار الشهادة الصحية هجري', type: 'text' },
  { name: 'issueDateGregorian', label: 'تاريخ إصدار الشهادة الصحية ميلادي', type: 'dateOnly' },
  { name: 'expiryDateHijri', label: 'تاريخ نهاية الشهادة الصحية هجري', type: 'text' },
  { name: 'expiryDateGregorian', label: 'تاريخ نهاية الشهادة الصحية ميلادي', type: 'dateOnly' },
  { name: 'programType', label: 'نوع البرنامج التثقيفي', type: 'text' },
  { name: 'programCompletionDateHijri', label: 'تاريخ انتهاء البرنامج التثقيفي', type: 'text' },
  { name: 'licenseNumber', label: 'رقم الرخصة', type: 'text' },
  { name: 'establishmentName', label: 'اسم المنشأة', type: 'text' },
  { name: 'establishmentNumber', label: 'رقم المنشأة', type: 'text' },
]

function directionFor(field: FieldConfig): 'rtl' | 'ltr' {
  if (field.type === 'dateOnly') return 'ltr'
  return RTL_TEXT_FIELDS.has(field.name) ? 'rtl' : 'ltr'
}

const DATE_ONLY_INPUT_CLASS =
  'w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-right text-text-primary outline-none focus:border-brand-primary'

/**
 * Gregorian date field that always displays and is typed as YYYY/MM/DD,
 * regardless of device/browser locale — a native <input type="date">'s
 * displayed text is controlled by the OS/browser (e.g. "15 Jul 2026" on
 * some iOS locales) and can't be forced into a fixed format. The value
 * passed to/from the parent is always the canonical "YYYY-MM-DD" (or "").
 */
function DateOnlyInput({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (isoValue: string) => void
}) {
  function toDisplayText(isoValue: string): string {
    const formatted = displayDateOnly(isoValue)
    return formatted === '–' ? '' : formatted
  }

  const [displayText, setDisplayText] = useState(() => toDisplayText(value))
  // Tracks which ISO value displayText was last derived from, so an
  // outside change (loading an employee, form reset, ID-card OCR autofill)
  // can be detected and re-synced during render — adjusting state while
  // rendering, rather than in an effect, avoids an extra render pass.
  const [syncedValue, setSyncedValue] = useState(value)

  if (value !== syncedValue) {
    setSyncedValue(value)
    setDisplayText(toDisplayText(value))
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 4) formatted = `${digits.slice(0, 4)}/${digits.slice(4)}`
    if (digits.length > 6) formatted = `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`

    setDisplayText(formatted)
    // Only a complete YYYY/MM/DD shape normalizes to a non-empty ISO value —
    // an in-progress value (e.g. "2026/07") intentionally clears the
    // underlying form value until it's a full date.
    const isoValue = normalizeDateOnly(formatted)
    setSyncedValue(isoValue)
    onChange(isoValue)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="YYYY/MM/DD"
      maxLength={10}
      dir="ltr"
      style={{ direction: 'ltr', textAlign: 'right' }}
      value={displayText}
      onChange={handleChange}
      className={DATE_ONLY_INPUT_CLASS}
    />
  )
}

/** The 96x96 admin-form thumbnail, cropped the same way as every other surface. */
function CroppedPhotoPreview({ src, crop }: { src: string; crop: EmployeePhotoCrop }) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const size = 96
  const rect = naturalSize
    ? computeCoverDrawRect(naturalSize.width, naturalSize.height, size, size, crop)
    : null

  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-field bg-surface-muted">
      <img
        src={src}
        alt="معاينة الصورة الشخصية"
        onLoad={(event) => {
          const img = event.currentTarget
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
        }}
        draggable={false}
        className="absolute select-none"
        style={rect ? { left: rect.x, top: rect.y, width: rect.width, height: rect.height } : { opacity: 0 }}
      />
    </div>
  )
}

type EmployeeFormProps = {
  defaultValues?: Partial<EmployeeFormValues>
  existingPhotoUrl?: string | null
  isSubmitting: boolean
  submitLabel: string
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>
  formError?: string | null
}

function EmployeeForm({
  defaultValues,
  existingPhotoUrl,
  isSubmitting,
  submitLabel,
  onSubmit,
  formError,
}: EmployeeFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl ?? null)
  const [fieldSuggestions, setFieldSuggestions] = useState<
    Partial<Record<EmployeeSuggestionField, string[]>>
  >({})
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractMessage, setExtractMessage] = useState<string | null>(null)
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  })

  const photoCrop = (watch('employeePhotoCrop') as EmployeePhotoCrop | null | undefined) ?? DEFAULT_PHOTO_CROP

  useEffect(() => {
    let cancelled = false

    getEmployeeFieldSuggestions()
      .then((suggestions) => {
        if (!cancelled) setFieldSuggestions(suggestions)
      })
      .catch(() => {
        // Suggestions are a convenience only — silently do without them.
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleIdCardChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsExtracting(true)
    setExtractMessage(null)
    try {
      const fields = await extractIdCardFields(file)
      const entries = Object.entries(fields) as Array<[TextFieldName, string]>
      for (const [name, value] of entries) {
        setValue(name, value, { shouldValidate: true })
      }
      setExtractMessage(
        entries.length > 0
          ? `تم استخراج ${entries.length} حقل/حقول من الهوية، يرجى مراجعتها وإكمال باقي الحقول يدويًا`
          : 'تعذر استخراج بيانات واضحة من صورة الهوية، يرجى تعبئة الحقول يدويًا',
      )
    } catch {
      setExtractMessage('تعذر معالجة صورة الهوية، يرجى المحاولة مرة أخرى أو التعبئة يدويًا')
    } finally {
      setIsExtracting(false)
    }
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    // Hold the file until the admin confirms a crop in the calibration
    // modal — the form's employeePhoto value isn't set (and nothing is
    // saved) until then.
    setPendingPhotoFile(file)
  }

  function handleCropConfirm(crop: EmployeePhotoCrop) {
    if (!pendingPhotoFile) return
    setValue('employeePhoto', pendingPhotoFile, { shouldValidate: true })
    setValue('employeePhotoCrop', crop, { shouldValidate: true })

    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(pendingPhotoFile)

    setPendingPhotoFile(null)
  }

  function handleCropCancel() {
    setPendingPhotoFile(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  function handleGregorianDateChange(field: TextFieldName, isoValue: string) {
    setValue(field, isoValue, { shouldValidate: true })
    const hijriField = GREGORIAN_TO_HIJRI[field]
    if (hijriField) {
      setValue(hijriField, isoValue ? gregorianToHijri(isoValue) : '', { shouldValidate: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="rounded-field border border-dashed border-divider p-4">
        <label htmlFor="idCardScan" className="mb-2 block text-sm font-bold text-text-primary">
          استخراج البيانات من صورة الهوية (اختياري)
        </label>
        <p className="mb-3 text-xs text-text-secondary">
          ارفع صورة هوية مقيم أو هوية وطنية لتعبئة الحقول المتاحة تلقائيًا. تتم معالجة الصورة داخل
          المتصفح فقط ولا يتم حفظها أو رفعها لأي خادم، ويبقى عليك مراجعة النتيجة وإكمال الحقول غير
          الموجودة على الهوية يدويًا.
        </p>
        <input
          id="idCardScan"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleIdCardChange}
          disabled={isExtracting}
          className="text-sm"
        />
        {isExtracting && (
          <p className="mt-2 text-sm text-text-secondary">جارٍ استخراج البيانات...</p>
        )}
        {extractMessage && !isExtracting && (
          <p className="mt-2 text-sm text-brand-primary">{extractMessage}</p>
        )}
      </div>

      <div>
        <label htmlFor="employeePhoto" className="mb-2 block text-sm font-bold text-text-primary">
          الصورة الشخصية
        </label>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <CroppedPhotoPreview src={photoPreview} crop={photoCrop} />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-field bg-surface-muted text-xs text-text-secondary">
              لا توجد صورة
            </div>
          )}
          <input
            id="employeePhoto"
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="text-sm"
          />
        </div>
        {errors.employeePhoto && (
          <p className="mt-2 text-sm text-expired">{errors.employeePhoto.message}</p>
        )}
      </div>

      {pendingPhotoFile && (
        <PhotoCropModal
          file={pendingPhotoFile}
          initialCrop={photoCrop}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {FIELDS.map((field) => {
        const dir = directionFor(field)

        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-2 block text-sm font-bold text-text-primary">
              {field.label}
            </label>

            {field.type === 'select' ? (
              <select
                id={field.name}
                dir={dir}
                style={{ direction: dir, textAlign: 'right' }}
                {...register(field.name)}
                className="w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-right text-text-primary outline-none focus:border-brand-primary"
              >
                <option value="">اختر</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === 'dateOnly' ? (
              <DateOnlyInput
                id={field.name}
                value={(watch(field.name) as string) || ''}
                onChange={(isoValue) => handleGregorianDateChange(field.name, isoValue)}
              />
            ) : (
              <>
                <input
                  id={field.name}
                  type="text"
                  dir={dir}
                  style={{ direction: dir, textAlign: 'right' }}
                  list={SUGGESTABLE_FIELDS.has(field.name) ? `${field.name}-suggestions` : undefined}
                  {...register(field.name)}
                  className="w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-right text-text-primary outline-none focus:border-brand-primary"
                />
                {SUGGESTABLE_FIELDS.has(field.name) && (
                  <datalist id={`${field.name}-suggestions`}>
                    {(fieldSuggestions[field.name as EmployeeSuggestionField] ?? []).map(
                      (value) => (
                        <option key={value} value={value} />
                      ),
                    )}
                  </datalist>
                )}
              </>
            )}

            {errors[field.name] && (
              <p className="mt-2 text-sm text-expired">{errors[field.name]?.message}</p>
            )}
          </div>
        )
      })}

      {formError && (
        <p role="alert" className="rounded-field bg-red-50 px-4 py-3 text-sm text-expired">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-button bg-brand-primary px-4 py-3 font-bold text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-60"
      >
        {isSubmitting ? 'جارٍ الحفظ...' : submitLabel}
      </button>
    </form>
  )
}

export default EmployeeForm
