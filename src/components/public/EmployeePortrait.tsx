type EmployeePortraitProps = {
  photoUrl: string | null
  employeeName: string
}

function EmployeePortrait({ photoUrl, employeeName }: EmployeePortraitProps) {
  return (
    <div className="mx-auto mt-[30px] mb-[28px] flex w-[184px] justify-center">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={employeeName}
          className="h-[184px] w-[184px] object-cover"
        />
      ) : (
        <div className="flex h-[184px] w-[184px] items-center justify-center bg-surface-muted text-[15px] text-text-secondary">
          لا توجد صورة
        </div>
      )}
    </div>
  )
}

export default EmployeePortrait
