type EmployeePortraitProps = {
  photoUrl: string | null
  employeeName: string
}

function EmployeePortrait({ photoUrl, employeeName }: EmployeePortraitProps) {
  return (
    <div className="mt-6 mb-10 flex justify-center sm:mt-8 sm:mb-12">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={employeeName}
          className="aspect-square object-cover"
          style={{ width: 'clamp(180px, 52vw, 210px)' }}
        />
      ) : (
        <div
          className="flex aspect-square items-center justify-center bg-surface-muted text-sm text-text-secondary"
          style={{ width: 'clamp(180px, 52vw, 210px)' }}
        >
          لا توجد صورة
        </div>
      )}
    </div>
  )
}

export default EmployeePortrait
