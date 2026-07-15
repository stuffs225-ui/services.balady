import type { EmployeeFormFieldStyles, EmployeeFormStylableField } from '../types/database'

export const EMPLOYEE_FORM_FIELD_ORDER: EmployeeFormStylableField[] = [
  'authorityName',
  'municipalityName',
  'employeeName',
  'identityNumber',
  'gender',
  'nationality',
  'certificateNumber',
  'profession',
  'issueDateHijri',
  'expiryDateHijri',
  'programType',
  'programCompletionDateHijri',
  'licenseNumber',
  'establishmentName',
  'establishmentNumber',
]

export const EMPLOYEE_FORM_FIELD_LABELS: Record<EmployeeFormStylableField, string> = {
  authorityName: 'الأمانة',
  municipalityName: 'البلدية',
  employeeName: 'الاسم',
  identityNumber: 'رقم الهوية',
  gender: 'الجنس',
  nationality: 'الجنسية',
  certificateNumber: 'رقم الشهادة الصحية',
  profession: 'المهنة',
  issueDateHijri: 'تاريخ إصدار الشهادة الصحية هجري',
  expiryDateHijri: 'تاريخ نهاية الشهادة الصحية هجري',
  programType: 'نوع البرنامج التثقيفي',
  programCompletionDateHijri: 'تاريخ انتهاء البرنامج التثقيفي',
  licenseNumber: 'رقم الرخصة',
  establishmentName: 'اسم المنشأة',
  establishmentNumber: 'رقم المنشأة',
}

/**
 * Single source of truth for how each admin-form field types/aligns by
 * default: plain Arabic text reads right-to-left, numeric/code/date-code
 * fields keep their digits reading left-to-right while still sitting at
 * the right edge of the field (matching the public page's convention).
 * Admins can override any of this from Settings.
 */
export const defaultEmployeeFormFieldStyles: EmployeeFormFieldStyles = {
  authorityName: { dir: 'rtl', align: 'right' },
  municipalityName: { dir: 'rtl', align: 'right' },
  employeeName: { dir: 'rtl', align: 'right' },
  identityNumber: { dir: 'ltr', align: 'right' },
  gender: { dir: 'rtl', align: 'right' },
  nationality: { dir: 'rtl', align: 'right' },
  certificateNumber: { dir: 'ltr', align: 'right' },
  profession: { dir: 'rtl', align: 'right' },
  issueDateHijri: { dir: 'ltr', align: 'right' },
  expiryDateHijri: { dir: 'ltr', align: 'right' },
  programType: { dir: 'rtl', align: 'right' },
  programCompletionDateHijri: { dir: 'ltr', align: 'right' },
  licenseNumber: { dir: 'ltr', align: 'right' },
  establishmentName: { dir: 'rtl', align: 'right' },
  establishmentNumber: { dir: 'ltr', align: 'right' },
}

/** Merges an admin-saved (possibly partial) style map on top of the defaults. */
export function mergeEmployeeFormFieldStyles(
  saved: Partial<EmployeeFormFieldStyles> | null | undefined,
): EmployeeFormFieldStyles {
  if (!saved) return defaultEmployeeFormFieldStyles
  const merged = { ...defaultEmployeeFormFieldStyles }
  for (const field of EMPLOYEE_FORM_FIELD_ORDER) {
    if (saved[field]) merged[field] = { ...merged[field], ...saved[field] }
  }
  return merged
}
