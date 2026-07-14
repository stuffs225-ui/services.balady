function AccessibilityToolbar() {
  return (
    <div className="flex items-center justify-between border-b border-divider bg-surface px-6 py-4 sm:px-7">
      <span className="flex items-center gap-2 text-[15px] font-medium text-text-primary sm:text-base">
        <SettingsIcon />
        الإعدادات
      </span>
      <span className="flex items-center gap-2 text-[15px] font-medium text-text-primary sm:text-base">
        أدوات سهولة الوصول
        <AccessibilityIcon />
      </span>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7 6.3 6.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AccessibilityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5.5" r="1.7" fill="currentColor" />
      <path
        d="M5 9.5c3.5 1 10.5 1 14 0M12 8v6l-3.5 6M12 14l3.5 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default AccessibilityToolbar
