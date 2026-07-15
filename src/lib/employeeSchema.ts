import { z } from 'zod'

const MAX_SHORT_TEXT = 120
const MAX_LONG_TEXT = 200

const requiredText = (label: string, max = MAX_SHORT_TEXT) =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .max(max, `${label} طويل جدًا (الحد الأقصى ${max} حرفًا)`)

const optionalText = (max = MAX_SHORT_TEXT) =>
  z
    .string()
    .trim()
    .max(max, `الحد الأقصى ${max} حرفًا`)
    .optional()
    .or(z.literal(''))

const isoDate = (label: string) =>
  z
    .string()
    .min(1, `${label} مطلوب`)
    .refine((value) => !Number.isNaN(Date.parse(value)), `${label} غير صالح`)

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const photoSchema = z
  .instanceof(File)
  .refine((file) => ACCEPTED_PHOTO_TYPES.includes(file.type), 'صيغة الصورة غير مدعومة (JPG أو PNG أو WebP فقط)')
  .refine((file) => file.size <= MAX_PHOTO_SIZE_BYTES, 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت')
  .optional()

const photoCropSchema = z
  .object({
    scale: z.number(),
    offsetX: z.number(),
    offsetY: z.number(),
  })
  .nullable()
  .optional()

export const employeeFormSchema = z
  .object({
    employeePhoto: photoSchema,
    employeePhotoCrop: photoCropSchema,
    authorityName: requiredText('الأمانة'),
    municipalityName: requiredText('البلدية'),
    employeeName: requiredText('الاسم'),
    identityNumber: z
      .string()
      .trim()
      .regex(/^\d{10}$/, 'رقم الهوية يجب أن يتكون من 10 أرقام بالضبط'),
    gender: requiredText('الجنس', 20),
    nationality: requiredText('الجنسية', 60),
    certificateNumber: requiredText('رقم الشهادة الصحية', 60),
    profession: requiredText('المهنة'),
    issueDateHijri: optionalText(30),
    issueDateGregorian: isoDate('تاريخ إصدار الشهادة الصحية ميلادي'),
    expiryDateHijri: optionalText(30),
    expiryDateGregorian: isoDate('تاريخ نهاية الشهادة الصحية ميلادي'),
    programType: optionalText(),
    programCompletionDateHijri: optionalText(30),
    licenseNumber: optionalText(60),
    establishmentName: requiredText('اسم المنشأة', MAX_LONG_TEXT),
    establishmentNumber: optionalText(60),
  })
  .refine(
    (data) => Date.parse(data.expiryDateGregorian) >= Date.parse(data.issueDateGregorian),
    {
      message: 'تاريخ النهاية يجب ألا يسبق تاريخ الإصدار',
      path: ['expiryDateGregorian'],
    },
  )

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export const employeeFieldOrder: Array<keyof EmployeeFormValues> = [
  'employeePhoto',
  'authorityName',
  'municipalityName',
  'employeeName',
  'identityNumber',
  'gender',
  'nationality',
  'certificateNumber',
  'profession',
  'issueDateHijri',
  'issueDateGregorian',
  'expiryDateHijri',
  'expiryDateGregorian',
  'programType',
  'programCompletionDateHijri',
  'licenseNumber',
  'establishmentName',
  'establishmentNumber',
]
