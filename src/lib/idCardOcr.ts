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
  // Not a generic "صاحب العمل" fallback — that substring also appears
  // inside "هوية صاحب العمل" (the employer's ID number label, a
  // different field entirely) and would grab the wrong line.
  establishmentName: ['اسم صاحب العمل'],
  establishmentNumber: ['هوية صاحب العمل'],
}

const ALL_LABELS = Object.values(FIELD_LABELS).flat()

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const EASTERN_ARABIC_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/**
 * Converts Arabic-Indic (٠-٩) and Eastern Arabic/Persian (۰-۹) digits to
 * plain Latin digits. Saudi ID cards print every number in Arabic-Indic
 * script, but this app's numeric fields (identity/establishment number)
 * store and validate plain Latin digits — without this conversion the
 * OCR'd digits were silently discarded entirely by \D-based extraction,
 * since JavaScript's \d only ever matches 0-9.
 */
export function normalizeDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (char) => {
    const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(char)
    if (arabicIndex !== -1) return String(arabicIndex)
    const easternIndex = EASTERN_ARABIC_DIGITS.indexOf(char)
    return easternIndex !== -1 ? String(easternIndex) : char
  })
}

// Matches "some Arabic word(s) immediately followed by a colon" — every
// field label on this card is printed exactly that way. Used to find
// where a second label:value pair starts when two are packed onto the
// same physical row (e.g. "رقم الهوية: ... تاريخ الانتهاء: ..."), even for
// labels (like the expiry date) this tool doesn't itself extract.
const LABEL_LIKE_PATTERN = /[ء-ي][ء-ي\s]{1,30}:/g

/**
 * The card packs two "label: value" pairs on the same physical row in
 * places, and OCR'd Arabic/RTL text can come out with the value on
 * either side of its label depending on how the recognizer reconstructs
 * reading order. Tries the text after the label first, then before it —
 * in both cases stopping at the next/previous label-like text so a
 * second pair on the same line is never swallowed into the wrong field.
 */
function valueNearLabelOnLine(line: string, label: string): string | null {
  const labelIndex = line.indexOf(label)
  if (labelIndex === -1) return null

  const afterRaw = line.slice(labelIndex + label.length).replace(/^[:\s]+/, '')
  LABEL_LIKE_PATTERN.lastIndex = 0
  const afterLabelMatch = LABEL_LIKE_PATTERN.exec(afterRaw)
  const after = (afterLabelMatch ? afterRaw.slice(0, afterLabelMatch.index) : afterRaw).trim()
  if (after) return after

  const before = line.slice(0, labelIndex)
  LABEL_LIKE_PATTERN.lastIndex = 0
  let lastMatch: RegExpExecArray | null = null
  let match: RegExpExecArray | null
  while ((match = LABEL_LIKE_PATTERN.exec(before)) !== null) {
    lastMatch = match
  }
  const beforeValue = lastMatch ? before.slice(lastMatch.index + lastMatch[0].length) : before
  const trimmedBefore = beforeValue.replace(/^[:\s]+/, '').trim()
  return trimmedBefore || null
}

function valueNearLabel(lines: string[], labels: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const label = labels.find((candidate) => line.includes(candidate))
    if (!label) continue

    const onLine = valueNearLabelOnLine(line, label)
    if (onLine) return onLine

    const nextLine = lines[i + 1]?.trim()
    if (nextLine && !ALL_LABELS.some((other) => nextLine.includes(other))) return nextLine
  }
  return null
}

const KNOWN_NON_NAME_LINES = ['هوية مقيم', 'رقم النسخة', 'المملكة العربية السعودية', 'وزارة الداخلية']
const ARABIC_LETTERS_ONLY = /^[ء-ي\s]+$/

/**
 * The Arabic full name printed on the card — this app's "الاسم" field is
 * Arabic, so this specifically extracts that line, not the English/Latin
 * transliteration printed just below it on the card. It's the longest
 * all-Arabic-letters line (no digits, no known field label) that appears
 * before the first labeled field, once the fixed header phrases are
 * excluded. Requires at least one recognized label to be present
 * somewhere in the text at all — otherwise this isn't an ID card scan,
 * and guessing a "name" from arbitrary Arabic text would just be wrong.
 */
function extractArabicName(lines: string[]): string | null {
  const firstLabelIndex = lines.findIndex((line) => ALL_LABELS.some((label) => line.includes(label)))
  if (firstLabelIndex === -1) return null
  const searchLines = lines.slice(0, firstLabelIndex)

  const candidates = searchLines.filter((line) => {
    if (KNOWN_NON_NAME_LINES.some((phrase) => line.includes(phrase))) return false
    if (!ARABIC_LETTERS_ONLY.test(line)) return false
    return line.split(/\s+/).filter(Boolean).length >= 2
  })
  if (candidates.length === 0) return null
  return candidates.reduce((longest, line) => (line.length > longest.length ? line : longest))
}

/**
 * The first run of 5+ digits, not every digit character in the string
 * concatenated together — a value can share its physical line with
 * another field (e.g. a date), and naively stripping non-digits would
 * glue both numbers into one.
 */
function extractDigits(value: string | null): string | null {
  if (!value) return null
  return value.match(/\d{5,}/)?.[0] ?? null
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
  const normalized = normalizeDigits(rawText)
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const result: IdCardExtractedFields = {}

  const name = extractArabicName(lines)
  if (name) result.employeeName = name

  const identityNumber =
    extractDigits(valueNearLabel(lines, FIELD_LABELS.identityNumber)) ??
    normalized.match(/\b\d{10}\b/)?.[0] ??
    null
  if (identityNumber) result.identityNumber = identityNumber

  const nationality = valueNearLabel(lines, FIELD_LABELS.nationality)
  if (nationality) result.nationality = nationality

  const profession = valueNearLabel(lines, FIELD_LABELS.profession)
  if (profession) result.profession = profession

  const establishmentName = valueNearLabel(lines, FIELD_LABELS.establishmentName)
  if (establishmentName) result.establishmentName = establishmentName

  const establishmentNumber = extractDigits(
    valueNearLabel(lines, FIELD_LABELS.establishmentNumber),
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
