import { useState } from 'react'
import { dateSettingOptions, type DatePreference } from '../../config/publicNavigation'

type AccessibilityToolbarProps = {
  datePreference: DatePreference | null
  onDatePreferenceChange: (value: DatePreference) => void
  isLargeText: boolean
  onToggleLargeText: () => void
}

function AccessibilityToolbar({
  datePreference,
  onDatePreferenceChange,
  isLargeText,
  onToggleLargeText,
}: AccessibilityToolbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="relative flex items-center justify-between border-b border-divider bg-surface px-6 py-4 print:hidden sm:px-7">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsSettingsOpen((prev) => !prev)}
          aria-expanded={isSettingsOpen}
          aria-controls="public-settings-menu"
          className="flex items-center gap-2 text-[15px] font-medium text-text-primary sm:text-base"
        >
          <SettingsIcon />
          الإعدادات
        </button>

        {isSettingsOpen && (
          <ul
            id="public-settings-menu"
            className="absolute top-full right-0 z-10 mt-2 w-56 rounded-field border border-divider bg-surface py-1 text-sm shadow-sm"
          >
            {dateSettingOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onDatePreferenceChange(option.value)
                    setIsSettingsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-right hover:bg-surface-muted ${
                    datePreference === option.value ? 'font-bold text-brand-primary' : ''
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleLargeText}
        aria-pressed={isLargeText}
        className="flex items-center gap-2 text-[15px] font-medium text-text-primary sm:text-base"
      >
        أدوات سهولة الوصول
        <AccessibilityIcon />
      </button>
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
