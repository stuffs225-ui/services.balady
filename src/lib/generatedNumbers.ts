import { gregorianToHijri, todayDateOnly } from './dates'

function randomDigits(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

/**
 * "47" + today's Hijri day/month (DDMM, 4 digits) + 6 random digits.
 * Regenerated fresh every time the new-employee form is opened.
 */
export function generateCertificateNumber(): string {
  const [, month, day] = gregorianToHijri(todayDateOnly()).split('/')
  return `47${day}${month}${randomDigits(6)}`
}

/**
 * Same shape as the certificate number, but the middle 4 digits are
 * today's Gregorian day/month (DDMM) instead of Hijri.
 */
export function generateLicenseNumber(): string {
  const [, month, day] = todayDateOnly().split('-')
  return `47${day}${month}${randomDigits(6)}`
}
