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
  return (
    <div className="mb-[30px]">
      <span
        className={`mb-[11px] block text-right font-bold text-text-primary ${
          largeText ? 'text-[20px] sm:text-2xl' : 'text-[18px] sm:text-xl'
        }`}
      >
        {label}
      </span>
      <div
        dir={dir}
        className={`flex min-h-[66px] items-center rounded-field border-[1.5px] px-[18px] py-[13px] leading-[1.45] ${
          largeText ? 'text-[22px]' : 'text-[20px]'
        } ${
          highlighted
            ? 'border-brand-primary bg-brand-primary-soft/10 text-text-primary'
            : 'border-input-border bg-input-bg text-text-secondary'
        } ${dir === 'rtl' ? 'justify-end text-right' : 'justify-start text-left'} ${
          monospace ? 'font-mono' : ''
        }`}
        style={{ unicodeBidi: 'plaintext' }}
      >
        {value || '—'}
      </div>
    </div>
  )
}

export default ReadOnlyField
