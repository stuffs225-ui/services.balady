import ReadOnlyField from './ReadOnlyField'
import type { PublicCertificate } from '../../types/database'
import type { DatePreference } from '../../config/publicNavigation'

type CertificateFieldListProps = {
  certificate: PublicCertificate
  datePreference?: DatePreference | null
  largeText?: boolean
}

function CertificateFieldList({
  certificate,
  datePreference = null,
  largeText = false,
}: CertificateFieldListProps) {
  const highlightHijri = datePreference === 'hijri'
  const highlightGregorian = datePreference === 'gregorian'

  return (
    <div className="mx-auto w-[calc(100%-56px)] max-w-[350px] max-[374px]:w-[calc(100%-40px)] md:max-w-[720px] md:w-[min(calc(100%-96px),720px)]">
      <ReadOnlyField label="الأمانة" value={certificate.authority_name} largeText={largeText} />
      <ReadOnlyField label="البلدية" value={certificate.municipality_name} largeText={largeText} />
      <ReadOnlyField label="الاسم" value={certificate.employee_name} largeText={largeText} />
      <ReadOnlyField
        label="رقم الهوية"
        value={certificate.identity_number_masked}
        dir="ltr"
        monospace
        largeText={largeText}
      />
      <ReadOnlyField label="الجنس" value={certificate.gender} largeText={largeText} />
      <ReadOnlyField label="الجنسية" value={certificate.nationality} largeText={largeText} />
      <ReadOnlyField
        label="رقم الشهادة الصحية"
        value={certificate.certificate_number}
        dir="ltr"
        monospace
        largeText={largeText}
      />
      <ReadOnlyField label="المهنة" value={certificate.profession} largeText={largeText} />
      <ReadOnlyField
        label="تاريخ إصدار الشهادة الصحية هجري"
        value={certificate.issue_date_hijri}
        dir="ltr"
        highlighted={highlightHijri}
        largeText={largeText}
      />
      <ReadOnlyField
        label="تاريخ إصدار الشهادة الصحية ميلادي"
        value={certificate.issue_date_gregorian}
        dir="ltr"
        highlighted={highlightGregorian}
        largeText={largeText}
      />
      <ReadOnlyField
        label="تاريخ نهاية الشهادة الصحية هجري"
        value={certificate.expiry_date_hijri}
        dir="ltr"
        highlighted={highlightHijri}
        largeText={largeText}
      />
      <ReadOnlyField
        label="تاريخ نهاية الشهادة الصحية ميلادي"
        value={certificate.expiry_date_gregorian}
        dir="ltr"
        highlighted={highlightGregorian}
        largeText={largeText}
      />
      <ReadOnlyField label="نوع البرنامج التثقيفى" value={certificate.program_type} largeText={largeText} />
      <ReadOnlyField
        label="تاريخ انتهاء البرنامج التثقيفي"
        value={certificate.program_completion_date_hijri}
        dir="ltr"
        largeText={largeText}
      />
      <ReadOnlyField
        label="رقم الرخصة"
        value={certificate.license_number}
        dir="ltr"
        monospace
        largeText={largeText}
      />
      <ReadOnlyField label="اسم المنشأة" value={certificate.establishment_name} largeText={largeText} />
      <ReadOnlyField
        label="رقم المنشأة"
        value={certificate.establishment_number}
        dir="ltr"
        monospace
        largeText={largeText}
      />
    </div>
  )
}

export default CertificateFieldList
