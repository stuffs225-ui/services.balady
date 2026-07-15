import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EmployeeForm from './EmployeeForm'
import { getEmployeeById, getEmployeePhotoUrl, updateEmployee, isUniqueViolation } from './api'
import type { Employee } from '../../types/database'
import type { EmployeeFormValues } from '../../lib/employeeSchema'
import { normalizePhotoCrop } from '../../lib/photoCrop'

function toDefaultValues(employee: Employee): Partial<EmployeeFormValues> {
  return {
    employeePhotoCrop: normalizePhotoCrop(employee.employee_photo_crop),
    authorityName: employee.authority_name,
    municipalityName: employee.municipality_name,
    employeeName: employee.employee_name,
    identityNumber: employee.identity_number,
    gender: employee.gender,
    nationality: employee.nationality,
    certificateNumber: employee.certificate_number,
    profession: employee.profession,
    issueDateHijri: employee.issue_date_hijri ?? '',
    issueDateGregorian: employee.issue_date_gregorian,
    expiryDateHijri: employee.expiry_date_hijri ?? '',
    expiryDateGregorian: employee.expiry_date_gregorian,
    programType: employee.program_type ?? '',
    programCompletionDateHijri: employee.program_completion_date_hijri ?? '',
    licenseNumber: employee.license_number ?? '',
    establishmentName: employee.establishment_name,
    establishmentNumber: employee.establishment_number ?? '',
  }
}

function EditEmployeePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        const data = await getEmployeeById(id!)
        if (cancelled) return
        setEmployee(data)
        if (data?.employee_photo_path) {
          const url = await getEmployeePhotoUrl(data.employee_photo_path)
          if (!cancelled) setPhotoUrl(url)
        }
      } catch {
        if (!cancelled) setLoadError('تعذر تحميل بيانات الموظف، يرجى تحديث الصفحة')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(values: EmployeeFormValues) {
    if (!employee) return
    setFormError(null)
    setIsSubmitting(true)

    try {
      await updateEmployee(employee.id, employee.public_token, employee.employee_photo_path, values)
      navigate(`/employees/${employee.id}`, { state: { updated: true } })
    } catch (error) {
      if (isUniqueViolation(error)) {
        setFormError('رقم الشهادة الصحية مستخدم من قبل، يرجى استخدام رقم مختلف')
      } else {
        setFormError('تعذر حفظ التعديلات، يرجى المحاولة مرة أخرى')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <p className="text-text-secondary">جارٍ التحميل...</p>
  }

  if (loadError) {
    return <p className="text-expired">{loadError}</p>
  }

  if (!employee) {
    return <p className="text-expired">تعذر العثور على الموظف</p>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-heading">تعديل بيانات الموظف</h1>
      <EmployeeForm
        defaultValues={toDefaultValues(employee)}
        existingPhotoUrl={photoUrl}
        isSubmitting={isSubmitting}
        submitLabel="حفظ التعديلات"
        onSubmit={handleSubmit}
        formError={formError}
      />
    </div>
  )
}

export default EditEmployeePage
