import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { employeeFormSchema, type EmployeeFormValues } from '../../lib/employeeSchema'
import { gregorianToHijri } from '../../lib/dates'
import { useSiteSettings } from '../settings/useSiteSettings'
import type { EmployeeFormFieldStyles, EmployeeFormStylableField } from '../../types/database'
import { getEmployeeFieldSuggestions, type EmployeeSuggestionField } from './api'
import { extractIdCardFields } from '../../lib/idCardOcr'

type TextFieldName = Exclude<keyof EmployeeFormValues, 'employeePhoto'>

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

type FieldConfig = {
  name: TextFieldName
  label: string
  type: 'text' | 'date' | 'select'
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
  { name: 'issueDateGregorian', label: 'تاريخ إصدار الشهادة الصحية ميلادي', type: 'date' },
  { name: 'expiryDateHijri', label: 'تاريخ نهاية الشهادة الصحية هجري', type: 'text' },
  { name: 'expiryDateGregorian', label: 'تاريخ نهاية الشهادة الصحية ميلادي', type: 'date' },
  { name: 'programType', label: 'نوع البرنامج التثقيفي', type: 'text' },
  { name: 'programCompletionDateHijri', label: 'تاريخ انتهاء البرنامج التثقيفي', type: 'text' },
  { name: 'licenseNumber', label: 'رقم الرخصة', type: 'text' },
  { name: 'establishmentName', label: 'اسم المنشأة', type: 'text' },
  { name: 'establishmentNumber', label: 'رقم المنشأة', type: 'text' },
]

const ALIGN_CLASS: Record<'right' | 'left' | 'center', string> = {
  right: 'text-right',
  left: 'text-left',
  center: 'text-center',
}

/**
 * Same effect as the dir attribute/ALIGN_CLASS above, expressed as inline
 * CSS too. Inline styles win over any stylesheet rule regardless of
 * specificity, so this is the one setting that's guaranteed to be visible
 * in the rendered field no matter what else is on the page.
 */
function directionStyle(style?: { dir: 'rtl' | 'ltr'; align: 'right' | 'left' | 'center' }) {
  if (!style) return undefined
  return { direction: style.dir, textAlign: style.align } as const
}

type EmployeeFormProps = {
  defaultValues?: Partial<EmployeeFormValues>
  existingPhotoUrl?: string | null
  isSubmitting: boolean
  submitLabel: string
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>
  formError?: string | null
  /** Overrides the saved field styles — used for the live preview in Settings. */
  fieldStylesOverride?: EmployeeFormFieldStyles
  /** Used by the Settings live preview: skips the ID-scan and suggestions
   * features, which are meaningless against fictional preview data. */
  previewMode?: boolean
}

function EmployeeForm({
  defaultValues,
  existingPhotoUrl,
  isSubmitting,
  submitLabel,
  onSubmit,
  formError,
  fieldStylesOverride,
  previewMode = false,
}: EmployeeFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl ?? null)
  const [fieldSuggestions, setFieldSuggestions] = useState<
    Partial<Record<EmployeeSuggestionField, string[]>>
  >({})
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractMessage, setExtractMessage] = useState<string | null>(null)
  const { employeeFormFieldStyles } = useSiteSettings()
  const fieldStyles = fieldStylesOverride ?? employeeFormFieldStyles

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (previewMode) return
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
  }, [previewMode])

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
    setValue('employeePhoto', file, { shouldValidate: true })

    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPhotoPreview(existingPhotoUrl ?? null)
    }
  }

  function styleFor(name: TextFieldName) {
    return fieldStyles[name as EmployeeFormStylableField]
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {!previewMode && (
        <div className="rounded-field border border-dashed border-divider p-4">
          <label htmlFor="idCardScan" className="mb-2 block text-sm font-bold text-text-primary">
            استخراج البيانات من صورة الهوية (اختياري)
          </label>
          <p className="mb-3 text-xs text-text-secondary">
            ارفع صورة هوية مقيم أو هوية وطنية لتعبئة الحقول المتاحة تلقائيًا. تتم معالجة الصورة
            داخل المتصفح فقط ولا يتم حفظها أو رفعها لأي خادم، ويبقى عليك مراجعة النتيجة وإكمال
            الحقول غير الموجودة على الهوية يدويًا.
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
      )}

      <div>
        <label htmlFor="employeePhoto" className="mb-2 block text-sm font-bold text-text-primary">
          الصورة الشخصية
        </label>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="معاينة الصورة الشخصية"
              className="h-24 w-24 rounded-field object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-field bg-surface-muted text-xs text-text-secondary">
              لا توجد صورة
            </div>
          )}
          <input
            id="employeePhoto"
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

      {FIELDS.map((field) => {
        const style = styleFor(field.name)

        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-2 block text-sm font-bold text-text-primary">
              {field.label}
            </label>

            {field.type === 'select' ? (
              <select
                id={field.name}
                dir={style?.dir}
                style={directionStyle(style)}
                {...register(field.name)}
                className={`w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-text-primary outline-none focus:border-brand-primary ${
                  style ? ALIGN_CLASS[style.align] : ''
                }`}
              >
                <option value="">اختر</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  id={field.name}
                  type={field.type}
                  dir={field.type === 'date' ? undefined : style?.dir}
                  style={field.type === 'date' ? undefined : directionStyle(style)}
                  list={SUGGESTABLE_FIELDS.has(field.name) ? `${field.name}-suggestions` : undefined}
                  {...register(
                    field.name,
                    GREGORIAN_TO_HIJRI[field.name]
                      ? {
                          onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                            const hijriField = GREGORIAN_TO_HIJRI[field.name]!
                            setValue(hijriField, gregorianToHijri(event.target.value), {
                              shouldValidate: true,
                            })
                          },
                        }
                      : undefined,
                  )}
                  className={`w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-text-primary outline-none focus:border-brand-primary ${
                    field.type !== 'date' && style ? ALIGN_CLASS[style.align] : ''
                  }`}
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
