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
  // Numbers, codes, and dates use dir="ltr" so the digits read left-to-right;
  // everything else is plain Arabic text. Either way the box itself is a
  // plain block element, never flex — justify-content's "end"/"start" have
  // been an unreliable way to pin content to the physical right edge across
  // browsers, unlike text-align, which does that consistently regardless of
  // the value's own reading direction.
  const kind = dir === 'ltr' ? 'number' : 'text'

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
        data-kind={kind}
        className={`block min-h-[44px] rounded-field border px-[14px] py-[8px] leading-[1.5] ${
          largeText ? 'text-[19px]' : 'text-[17px]'
        } ${
          highlighted
            ? 'border-brand-primary bg-brand-primary-soft/10 text-text-primary'
            : 'border-field-border bg-field-bg text-field-value'
        } ${monospace ? 'font-mono' : ''}`}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          direction: dir,
          textAlign: 'right',
          unicodeBidi: 'plaintext',
        }}
      >
        {value || '–'}
      </div>
    </div>
  )
}

export default ReadOnlyField
