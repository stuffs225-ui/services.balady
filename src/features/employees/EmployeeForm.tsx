import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { employeeFormSchema, type EmployeeFormValues } from '../../lib/employeeSchema'
import { gregorianToHijri } from '../../lib/dates'

type TextFieldName = Exclude<keyof EmployeeFormValues, 'employeePhoto'>

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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  })

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
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

      {FIELDS.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="mb-2 block text-sm font-bold text-text-primary">
            {field.label}
          </label>

          {field.type === 'select' ? (
            <select
              id={field.name}
              {...register(field.name)}
              className="w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-text-primary outline-none focus:border-brand-primary"
            >
              <option value="">اختر</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.name}
              type={field.type}
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
              className="w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-text-primary outline-none focus:border-brand-primary"
            />
          )}

          {errors[field.name] && (
            <p className="mt-2 text-sm text-expired">{errors[field.name]?.message}</p>
          )}
        </div>
      ))}

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
