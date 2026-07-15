import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeForm from './EmployeeForm'
import { createEmployee, isUniqueViolation } from './api'
import type { EmployeeFormValues } from '../../lib/employeeSchema'
import {
  CERTIFICATE_VALIDITY_DAYS,
  PROGRAM_VALIDITY_DAYS,
  addDaysISO,
  gregorianToHijri,
  todayDateOnly,
} from '../../lib/dates'
import { generateCertificateNumber, generateLicenseNumber } from '../../lib/generatedNumbers'

function buildDefaultValues(): Partial<EmployeeFormValues> {
  const issue = todayDateOnly()
  const expiry = addDaysISO(issue, CERTIFICATE_VALIDITY_DAYS)
  const programCompletion = addDaysISO(issue, PROGRAM_VALIDITY_DAYS)
  return {
    issueDateGregorian: issue,
    issueDateHijri: gregorianToHijri(issue),
    expiryDateGregorian: expiry,
    expiryDateHijri: gregorianToHijri(expiry),
    programCompletionDateHijri: gregorianToHijri(programCompletion),
    certificateNumber: generateCertificateNumber(),
    licenseNumber: generateLicenseNumber(),
  }
}

function NewEmployeePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  // Sensible defaults the admin can still override: issue date = today,
  // expiry date = +365 days, program completion = +1095 days, matching
  // Hijri dates pre-filled, and a freshly generated certificate/license
  // number for this registration.
  const defaultValues = useMemo(() => buildDefaultValues(), [])

  async function handleSubmit(values: EmployeeFormValues) {
    setFormError(null)
    setIsSubmitting(true)

    try {
      const employee = await createEmployee(values)
      navigate(`/employees/${employee.id}`, { state: { created: true } })
    } catch (error) {
      if (isUniqueViolation(error)) {
        setFormError('رقم الشهادة الصحية مستخدم من قبل، يرجى استخدام رقم مختلف')
      } else {
        setFormError('تعذر حفظ بيانات الموظف، يرجى المحاولة مرة أخرى')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-heading">إضافة موظف جديد</h1>
      <EmployeeForm
        defaultValues={defaultValues}
        isSubmitting={isSubmitting}
        submitLabel="حفظ"
        onSubmit={handleSubmit}
        formError={formError}
      />
    </div>
  )
}

export default NewEmployeePage
