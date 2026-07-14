type ReadOnlyFieldProps = {
  label: string
  value: string | null | undefined
  dir?: 'rtl' | 'ltr'
  monospace?: boolean
}

function ReadOnlyField({ label, value, dir = 'rtl', monospace = false }: ReadOnlyFieldProps) {
  return (
    <div className="mb-[30px]">
      <span className="mb-[11px] block text-right text-[18px] font-bold text-text-primary sm:text-xl">
        {label}
      </span>
      <div
        dir={dir}
        className={`flex min-h-[66px] items-center rounded-field border-[1.5px] border-input-border bg-input-bg px-[18px] py-[13px] text-[20px] leading-[1.45] text-text-secondary ${
          dir === 'rtl' ? 'justify-end text-right' : 'justify-start text-left'
        } ${monospace ? 'font-mono' : ''}`}
        style={{ unicodeBidi: 'plaintext' }}
      >
        {value || '—'}
      </div>
    </div>
  )
}

export default ReadOnlyField
