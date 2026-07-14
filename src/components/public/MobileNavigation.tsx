import { navLinks as defaultNavLinks, primaryActionLink, searchLink } from '../../config/siteLinks'
import type { NavLinkSetting } from '../../types/database'

type MobileNavigationProps = {
  isOpen: boolean
  navLinks?: NavLinkSetting[]
}

function MobileNavigation({ isOpen, navLinks = defaultNavLinks }: MobileNavigationProps) {
  return (
    <nav
      id="public-mobile-navigation"
      aria-label="التنقل الرئيسي"
      className={`overflow-hidden bg-surface transition-[max-height,opacity] duration-200 ease-out ${
        isOpen ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <ul>
        {navLinks.map((link, index) => {
          const isActive = index === 1
          return (
            <li key={link.href} className="border-b border-divider last:border-b-0">
              <a
                href={link.href}
                className={`flex min-h-[64px] items-center justify-between px-7 text-lg font-medium sm:text-xl ${
                  isActive
                    ? 'bg-brand-primary text-white'
                    : 'text-text-primary hover:bg-surface-muted'
                }`}
              >
                {link.label}
                <ChevronIcon />
              </a>
            </li>
          )
        })}
      </ul>

      <div className="px-7 py-[26px]">
        <a
          href={primaryActionLink.href}
          className="flex min-h-[60px] items-center justify-center rounded-button bg-brand-primary text-lg font-bold text-white"
        >
          {primaryActionLink.label}
        </a>
      </div>

      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="flex min-h-[64px] items-center gap-3 border-t border-divider px-7"
      >
        <SearchIcon />
        <input
          type="search"
          name="q"
          placeholder={searchLink.label}
          aria-label={searchLink.label}
          className="min-w-0 flex-1 bg-transparent text-lg font-medium text-text-primary outline-none placeholder:text-text-secondary sm:text-xl"
        />
      </form>
    </nav>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-text-secondary">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default MobileNavigation
