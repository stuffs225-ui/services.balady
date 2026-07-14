import { useEffect, useState } from 'react'
import Logo from '../brand/Logo'
import { siteIdentity } from '../../config/siteLinks'
import MobileNavigation from './MobileNavigation'
import { useSiteSettings } from '../../features/settings/useSiteSettings'

function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const { logoUrl, navLinks } = useSiteSettings()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="min-h-[78px] bg-surface print:hidden">
      <div className="flex min-h-[78px] items-center justify-between px-[18px] py-[12px]">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={siteIdentity.nameAr} className="h-8 w-8 object-contain" />
          ) : (
            <Logo className="h-8 w-8" />
          )}
          <div className="text-right">
            <p className="text-sm font-bold text-heading">{siteIdentity.nameAr}</p>
            <p className="text-xs font-medium text-brand-primary">({siteIdentity.demoLabel})</p>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="public-mobile-navigation"
          aria-label="فتح قائمة التنقل"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center text-text-primary"
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <MobileNavigation isOpen={isOpen} navLinks={navLinks} />

      <div className="border-t border-divider" />
    </header>
  )
}

function MenuIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default PublicHeader
