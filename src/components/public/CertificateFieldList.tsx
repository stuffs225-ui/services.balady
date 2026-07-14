import ReadOnlyField from './ReadOnlyField'
import type { PublicCertificate } from '../../types/database'

type CertificateFieldListProps = {
  certificate: PublicCertificate
}

function CertificateFieldList({ certificate }: CertificateFieldListProps) {
  return (
    <div className="w-[min(calc(100%-56px),720px)] max-[374px]:w-[calc(100%-40px)] mx-auto md:w-[min(calc(100%-96px),720px)]">
      <ReadOnlyField label="الأمانة" value={certificate.authority_name} />
      <ReadOnlyField label="البلدية" value={certificate.municipality_name} />
      <ReadOnlyField label="الاسم" value={certificate.employee_name} />
      <ReadOnlyField label="رقم الهوية" value={certificate.identity_number_masked} dir="ltr" monospace />
      <ReadOnlyField label="الجنس" value={certificate.gender} />
      <ReadOnlyField label="الجنسية" value={certificate.nationality} />
      <ReadOnlyField label="رقم الشهادة الصحية" value={certificate.certificate_number} dir="ltr" monospace />
      <ReadOnlyField label="المهنة" value={certificate.profession} />
      <ReadOnlyField
        label="تاريخ إصدار الشهادة الصحية هجري"
        value={certificate.issue_date_hijri}
        dir="ltr"
      />
      <ReadOnlyField
        label="تاريخ إصدار الشهادة الصحية ميلادي"
        value={certificate.issue_date_gregorian}
        dir="ltr"
      />
      <ReadOnlyField
        label="تاريخ نهاية الشهادة الصحية هجري"
        value={certificate.expiry_date_hijri}
        dir="ltr"
      />
      <ReadOnlyField
        label="تاريخ نهاية الشهادة الصحية ميلادي"
        value={certificate.expiry_date_gregorian}
        dir="ltr"
      />
      <ReadOnlyField label="نوع البرنامج التثقيفى" value={certificate.program_type} />
      <ReadOnlyField
        label="تاريخ انتهاء البرنامج التثقيفي"
        value={certificate.program_completion_date_hijri}
        dir="ltr"
      />
      <ReadOnlyField label="رقم الرخصة" value={certificate.license_number} dir="ltr" monospace />
      <ReadOnlyField label="اسم المنشأة" value={certificate.establishment_name} />
      <ReadOnlyField
        label="رقم المنشأة"
        value={certificate.establishment_number}
        dir="ltr"
        monospace
      />
    </div>
  )
}

export default CertificateFieldList
