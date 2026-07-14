const LONG_LABEL_THRESHOLD = 26

type ReadOnlyFieldProps = {
  label: string
  value: string | null | undefined
  dir?: 'rtl' | 'ltr'
  monospace?: boolean
  highlighted?: boolean
  largeText?: boolean
}

function ReadOnlyField({
  label,
  value,
  dir = 'rtl',
  monospace = false,
  highlighted = false,
  largeText = false,
}: ReadOnlyFieldProps) {
  const isLongLabel = label.length > LONG_LABEL_THRESHOLD

  return (
    <div className="employee-field mb-[21px]">
      <span
        className={`mb-[8px] block text-right font-bold leading-[1.45] text-text-primary ${
          largeText ? 'text-[19px]' : isLongLabel ? 'text-[15px]' : 'text-[16px]'
        }`}
      >
        {label}
      </span>
      <div
        dir={dir}
        className={`flex min-h-[44px] items-center rounded-field border px-[14px] py-[8px] leading-[1.5] ${
          largeText ? 'text-[19px]' : 'text-[17px]'
        } ${
          highlighted
            ? 'border-brand-primary bg-brand-primary-soft/10 text-text-primary'
            : 'border-field-border bg-field-bg text-field-value'
        } justify-end text-right ${monospace ? 'font-mono' : ''}`}
        style={{ unicodeBidi: 'plaintext' }}
      >
        {value || '–'}
      </div>
    </div>
  )
}

export default ReadOnlyField
