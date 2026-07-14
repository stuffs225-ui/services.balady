function VerificationNetworkErrorState() {
  return (
    <div className="mx-auto flex w-[85%] max-w-md flex-col items-center gap-3 py-16 text-center">
      <p className="text-xl font-bold text-heading">تعذر الاتصال بخدمة التحقق حاليًا.</p>
      <p className="text-text-secondary">يرجى المحاولة مرة أخرى.</p>
    </div>
  )
}

export default VerificationNetworkErrorState
