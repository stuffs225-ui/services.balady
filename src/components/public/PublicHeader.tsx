import { useEffect, useState } from 'react'
import Logo from '../brand/Logo'
import { siteIdentity } from '../../config/siteLinks'
import MobileNavigation from './MobileNavigation'
import { useSiteSettings } from '../../features/settings/useSiteSettings'

function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const { logoUrl, navLinks, logoSize = 96 } = useSiteSettings()

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

        {logoUrl ? (
          <img
            src={logoUrl}
            alt={siteIdentity.nameAr}
            style={{ width: logoSize, height: logoSize }}
            className="object-contain"
          />
        ) : (
          <Logo size={logoSize} />
        )}
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
