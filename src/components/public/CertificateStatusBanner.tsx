import type { CertificateStatus } from '../../types/database'

const STATUS_STYLES: Record<CertificateStatus, string> = {
  active: 'bg-brand-primary-soft/20 text-brand-primary',
  expired: 'bg-red-100 text-expired',
  revoked: 'bg-red-100 text-revoked',
}

const STATUS_LABELS: Record<CertificateStatus, string> = {
  active: 'سارية',
  expired: 'منتهية',
  revoked: 'ملغاة',
}

const STATUS_MESSAGES: Partial<Record<CertificateStatus, string>> = {
  expired: 'انتهت صلاحية هذه الشهادة',
  revoked: 'هذه الشهادة ملغاة',
}

function CertificateStatusBanner({ status }: { status: CertificateStatus }) {
  const message = STATUS_MESSAGES[status]

  return (
    <div className="mx-auto mt-4 flex w-fit flex-col items-center gap-1">
      <span
        className={`rounded-full px-4 py-1.5 text-[13px] font-bold sm:text-sm ${STATUS_STYLES[status]}`}
      >
        {STATUS_LABELS[status]}
      </span>
      {message && <p className="text-sm font-medium text-text-secondary">{message}</p>}
    </div>
  )
}

export default CertificateStatusBanner
