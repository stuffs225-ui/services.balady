import { useState } from 'react'

function PublicTrustBanner() {
  const [showHelp, setShowHelp] = useState(
    () => window.location.hash === '#digital-verification',
  )

  return (
    <section
      id="digital-verification"
      className="border-b border-divider bg-surface px-6 pt-4 pb-5 text-center print:hidden"
    >
      <p className="mx-auto w-[88%] text-[15px] font-medium text-text-secondary sm:text-base">
        نسخة تجريبية غير تابعة لأي جهة حكومية
      </p>
      <button
        type="button"
        onClick={() => setShowHelp((prev) => !prev)}
        aria-expanded={showHelp}
        aria-controls="digital-verification-panel"
        className="mt-2 text-sm font-medium text-brand-primary underline underline-offset-2"
      >
        كيف تتحقق
      </button>

      {showHelp && (
        <p
          id="digital-verification-panel"
          className="mx-auto mt-3 w-[88%] max-w-md text-sm text-text-secondary"
        >
          هذه بيئة تجريبية لأغراض العرض فقط. يمكنك التحقق من صحة الشهادة عبر مسح رمز الاستجابة
          السريعة أو فتح الرابط العام الخاص بها.
        </p>
      )}
    </section>
  )
}

export default PublicTrustBanner
