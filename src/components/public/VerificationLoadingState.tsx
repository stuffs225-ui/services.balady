function VerificationLoadingState() {
  return (
    <div className="w-[min(calc(100%-56px),720px)] mx-auto animate-pulse py-10">
      <div className="mx-auto mb-10 h-[190px] w-[190px] rounded-full bg-surface-muted" />
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="mb-[30px]">
          <div className="mb-[11px] h-5 w-1/3 rounded bg-surface-muted" />
          <div className="h-[66px] rounded-field bg-surface-muted" />
        </div>
      ))}
    </div>
  )
}

export default VerificationLoadingState
