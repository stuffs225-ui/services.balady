export type IdCardExtractedField =
  | 'employeeName'
  | 'identityNumber'
  | 'nationality'
  | 'profession'
  | 'establishmentName'
  | 'establishmentNumber'

export type IdCardExtractedFields = Partial<Record<IdCardExtractedField, string>>

type LabeledField = Exclude<IdCardExtractedField, 'employeeName'>

const FIELD_LABELS: Record<LabeledField, string[]> = {
  identityNumber: ['رقم الهوية'],
  nationality: ['الجنسية'],
  profession: ['المهنة'],
  establishmentName: ['اسم صاحب العمل', 'صاحب العمل'],
  establishmentNumber: ['هوية صاحب العمل'],
}

const ALL_LABELS = Object.values(FIELD_LABELS).flat()

function valueOnOrAfterLine(lines: string[], labels: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const label = labels.find((candidate) => line.includes(candidate))
    if (!label) continue

    const sameLine = line
      .slice(line.indexOf(label) + label.length)
      .replace(/^[:\s]+/, '')
      .trim()
    if (sameLine && !ALL_LABELS.some((other) => sameLine.includes(other))) return sameLine

    const nextLine = lines[i + 1]?.trim()
    if (nextLine && !ALL_LABELS.some((other) => nextLine.includes(other))) return nextLine
  }
  return null
}

function extractEnglishName(rawText: string): string | null {
  const candidates = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[A-Z][A-Z\s]{4,}$/.test(line))
  if (candidates.length === 0) return null
  return candidates.reduce((longest, line) => (line.length > longest.length ? line : longest))
}

function extractDigits(value: string | null): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits.length >= 5 ? digits : null
}

/**
 * Best-effort parsing of raw OCR text from a Saudi ID/Iqama card into form
 * fields. Kept separate from the OCR engine so the parsing rules can be unit
 * tested without running real image recognition. Only fields that are
 * actually printed on an ID card are extracted — certificate-specific data
 * (authority, dates, program, license) is never present on an ID and is
 * left for the admin to fill in manually.
 */
export function parseIdCardText(rawText: string): IdCardExtractedFields {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const result: IdCardExtractedFields = {}

  const name = extractEnglishName(rawText)
  if (name) result.employeeName = name

  const identityNumber =
    extractDigits(valueOnOrAfterLine(lines, FIELD_LABELS.identityNumber)) ??
    rawText.match(/\b\d{10}\b/)?.[0] ??
    null
  if (identityNumber) result.identityNumber = identityNumber

  const nationality = valueOnOrAfterLine(lines, FIELD_LABELS.nationality)
  if (nationality) result.nationality = nationality

  const profession = valueOnOrAfterLine(lines, FIELD_LABELS.profession)
  if (profession) result.profession = profession

  const establishmentName = valueOnOrAfterLine(lines, FIELD_LABELS.establishmentName)
  if (establishmentName) result.establishmentName = establishmentName

  const establishmentNumber = extractDigits(
    valueOnOrAfterLine(lines, FIELD_LABELS.establishmentNumber),
  )
  if (establishmentNumber) result.establishmentNumber = establishmentNumber

  return result
}

/**
 * Runs OCR on an ID card image entirely in the browser (Tesseract.js,
 * loaded on demand). The image is never uploaded to Supabase or any other
 * server — it is read, recognized, and discarded in memory.
 */
export async function extractIdCardFields(file: File): Promise<IdCardExtractedFields> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['ara', 'eng'])
  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return parseIdCardText(text)
  } finally {
    await worker.terminate()
  }
}
