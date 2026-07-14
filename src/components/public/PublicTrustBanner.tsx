import { useState } from 'react'

function PublicTrustBanner() {
  const [showHelp, setShowHelp] = useState(
    () => window.location.hash === '#digital-verification',
  )

  return (
    <section
      id="digital-verification"
      className="min-h-[108px] border-b border-divider bg-surface-muted px-[20px] pt-[14px] pb-[12px] text-center print:hidden"
    >
      <p className="mx-auto m-0 w-[88%] text-[13px] leading-[1.5] font-medium text-public-body">
        نسخة تجريبية غير تابعة لأي جهة حكومية
      </p>
      <button
        type="button"
        onClick={() => setShowHelp((prev) => !prev)}
        aria-expanded={showHelp}
        aria-controls="digital-verification-panel"
        className="mt-2 text-[13px] font-medium text-brand-primary underline underline-offset-2"
      >
        كيف تتحقق
      </button>

      {showHelp && (
        <p
          id="digital-verification-panel"
          className="mx-auto mt-3 w-[88%] max-w-md text-[13px] leading-[1.5] text-public-body"
        >
          هذه بيئة تجريبية لأغراض العرض فقط. يمكنك التحقق من صحة الشهادة عبر مسح رمز الاستجابة
          السريعة أو فتح الرابط العام الخاص بها.
        </p>
      )}
    </section>
  )
}

export default PublicTrustBanner
