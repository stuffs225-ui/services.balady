import type { EmployeeCardLayout } from '../types/database'

/** Natural pixel size of the calibration sample the default layout was measured against. */
export const TEMPLATE_NATURAL_WIDTH = 1004
export const TEMPLATE_NATURAL_HEIGHT = 638

/**
 * Physical printed card size (ID-card format), in millimeters. The PDF
 * export renders at exactly this page size — no A4, no scale-to-fit, no
 * margins — so 1004x638px at this physical size works out to ~300 DPI.
 */
export const CARD_PHYSICAL_WIDTH_MM = 84.93
export const CARD_PHYSICAL_HEIGHT_MM = 53.98

/**
 * Single source of truth for where each dynamic value sits on the employee
 * card template, as percentages of the template image's natural size.
 * Never duplicate these numbers elsewhere — read them from here (or from
 * the admin-saved override in site_settings.employee_card_layout).
 */
export const defaultEmployeeCardLayout: EmployeeCardLayout = {
  fullName: {
    x: 64.7,
    y: 22.7,
    width: 33.0,
    height: 8.5,
    fontSize: 34,
    color: '#4C8088',
    align: 'right',
  },
  photo: {
    x: 2.19,
    y: 18.81,
    width: 20.92,
    height: 32.92,
  },
  qr: {
    x: 1.89,
    y: 54.23,
    width: 21.22,
    height: 33.54,
  },
  identityNumber: {
    x: 62.55,
    y: 36.99,
    width: 36.65,
    height: 7.52,
    fontSize: 17,
    color: '#111111',
    align: 'right',
  },
  nationality: {
    x: 24.6,
    y: 37.46,
    width: 35.56,
    height: 7.05,
    fontSize: 17,
    color: '#111111',
    align: 'right',
  },
  certificateNumber: {
    x: 62.55,
    y: 51.1,
    width: 36.45,
    height: 7.52,
    fontSize: 17,
    color: '#111111',
    align: 'right',
  },
  profession: {
    x: 24.6,
    y: 51.57,
    width: 35.56,
    height: 6.9,
    fontSize: 17,
    color: '#111111',
    align: 'right',
  },
  issueDate: {
    x: 62.65,
    y: 65.67,
    width: 36.25,
    height: 7.52,
    fontSize: 17,
    color: '#111111',
    align: 'right',
  },
  expiryDate: {
    x: 24.7,
    y: 66.14,
    width: 35.56,
    height: 7.05,
    fontSize: 17,
    color: '#111111',
    align: 'right',
  },
  educationProgramType: {
    x: 62.75,
    y: 80.25,
    width: 36.55,
    height: 7.99,
    fontSize: 17,
    color: '#111111',
    align: 'right',
  },
  educationProgramExpiry: {
    x: 24.6,
    y: 80.72,
    width: 35.76,
    height: 7.52,
    fontSize: 17,
    color: '#111111',
    align: 'right',
  },
}

/** Text fields whose values must render as LTR digit/date sequences. */
export const EMPLOYEE_CARD_NUMERIC_FIELDS = [
  'identityNumber',
  'certificateNumber',
  'issueDate',
  'expiryDate',
  'educationProgramExpiry',
] as const

export const EMPLOYEE_CARD_TEXT_FIELD_ORDER = [
  'fullName',
  'identityNumber',
  'nationality',
  'certificateNumber',
  'profession',
  'issueDate',
  'expiryDate',
  'educationProgramType',
  'educationProgramExpiry',
] as const

export const EMPLOYEE_CARD_MEDIA_FIELD_ORDER = ['photo', 'qr'] as const

export const EMPLOYEE_CARD_FIELD_LABELS: Record<keyof EmployeeCardLayout, string> = {
  fullName: 'الاسم الكامل',
  photo: 'الصورة الشخصية',
  qr: 'رمز الاستجابة السريعة',
  identityNumber: 'رقم الهوية',
  nationality: 'الجنسية',
  certificateNumber: 'رقم الشهادة الصحية',
  profession: 'المهنة',
  issueDate: 'تاريخ إصدار الشهادة',
  expiryDate: 'تاريخ نهاية الشهادة',
  educationProgramType: 'نوع البرنامج التثقيفي',
  educationProgramExpiry: 'تاريخ انتهاء البرنامج التثقيفي',
}

/**
 * Merges an admin-saved (possibly partial) layout on top of the defaults,
 * per field, so a calibration save that only touched some fields doesn't
 * lose the default position of the others.
 */
export function mergeEmployeeCardLayout(
  saved: Partial<EmployeeCardLayout> | null | undefined,
): EmployeeCardLayout {
  if (!saved) return defaultEmployeeCardLayout
  return {
    fullName: { ...defaultEmployeeCardLayout.fullName, ...saved.fullName },
    photo: { ...defaultEmployeeCardLayout.photo, ...saved.photo },
    qr: { ...defaultEmployeeCardLayout.qr, ...saved.qr },
    identityNumber: { ...defaultEmployeeCardLayout.identityNumber, ...saved.identityNumber },
    nationality: { ...defaultEmployeeCardLayout.nationality, ...saved.nationality },
    certificateNumber: {
      ...defaultEmployeeCardLayout.certificateNumber,
      ...saved.certificateNumber,
    },
    profession: { ...defaultEmployeeCardLayout.profession, ...saved.profession },
    issueDate: { ...defaultEmployeeCardLayout.issueDate, ...saved.issueDate },
    expiryDate: { ...defaultEmployeeCardLayout.expiryDate, ...saved.expiryDate },
    educationProgramType: {
      ...defaultEmployeeCardLayout.educationProgramType,
      ...saved.educationProgramType,
    },
    educationProgramExpiry: {
      ...defaultEmployeeCardLayout.educationProgramExpiry,
      ...saved.educationProgramExpiry,
    },
  }
}
