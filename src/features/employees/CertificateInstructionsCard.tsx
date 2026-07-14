import Logo from '../../components/brand/Logo'
import { siteIdentity } from '../../config/siteLinks'

const INSTRUCTIONS = [
  'الشهادة الصحية تُجدد سنويًا.',
  'يسمح لحامل الشهادة الصحية بالعمل في المنشآت التجريبية وفق المهنة المسموح بها نظامًا.',
  'يلزم حامل هذه الشهادة بإجراء فحص طبي عند عودته من الخارج قبل البدء بممارسة العمل.',
  'لا تعتبر هذه الشهادة إثبات هوية.',
]

/**
 * The reverse face of the printed certificate card: generic
 * instructions/disclaimer text, styled like the reference card's back but
 * with the app's own neutral demo mark instead of any real government seal.
 */
function CertificateInstructionsCard() {
  return (
    <div
      dir="rtl"
      className="relative flex flex-col overflow-hidden rounded-field bg-certificate-heading p-[4mm] text-white print:rounded-none"
      style={{ width: '85.6mm', height: '54mm' }}
    >
      <div className="mb-[2.5mm] flex items-center justify-between gap-[2mm]">
        <p className="text-[8px] font-bold">تعليمات وإرشادات</p>
        <Logo variant="inverted" className="h-[7mm] w-[7mm] shrink-0" />
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-[1.8mm]">
        {INSTRUCTIONS.map((line) => (
          <li key={line} className="flex items-start gap-[1.2mm] text-[5.5px] leading-tight">
            <span aria-hidden="true">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <p className="border-t border-white/30 pt-[0.8mm] text-center text-[5px] text-white/80">
        {siteIdentity.demoDisclaimer}
      </p>
    </div>
  )
}

export default CertificateInstructionsCard
