import { useState } from 'react'
import { navLinks as defaultNavLinks, primaryActionLink, searchLink } from '../../config/siteLinks'
import type { NavLinkSetting } from '../../types/database'

type MobileNavigationProps = {
  isOpen: boolean
  navLinks?: NavLinkSetting[]
  primaryActionLabel?: string
  primaryActionHref?: string
}

function MobileNavigation({
  isOpen,
  navLinks = defaultNavLinks,
  primaryActionLabel = primaryActionLink.label,
  primaryActionHref = primaryActionLink.href,
}: MobileNavigationProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  // Tracks which isOpen value expandedIndex was last computed for, so
  // closing the whole mobile nav also collapses any open dropdown — done
  // during render (not inside an effect) per this app's established
  // render-time-adjustment pattern.
  const [syncedIsOpen, setSyncedIsOpen] = useState(isOpen)

  if (isOpen !== syncedIsOpen) {
    setSyncedIsOpen(isOpen)
    if (!isOpen) setExpandedIndex(null)
  }

  return (
    <nav
      id="public-mobile-navigation"
      aria-label="التنقل الرئيسي"
      className={`overflow-hidden bg-surface transition-[max-height,opacity] duration-200 ease-out ${
        isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <ul>
        {navLinks.map((link, index) => {
          const isActive = index === 1
          const hasSections = Boolean(link.sections?.length)
          const isExpanded = hasSections && expandedIndex === index

          return (
            <li key={`${link.label}-${index}`} className="border-b border-divider last:border-b-0">
              {hasSections ? (
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedIndex((prev) => (prev === index ? null : index))}
                  className={`flex min-h-[64px] w-full items-center justify-between px-7 text-lg font-medium sm:text-xl ${
                    isExpanded ? 'bg-surface-muted text-text-primary' : 'text-text-primary hover:bg-surface-muted'
                  }`}
                >
                  {link.label}
                  <DropdownChevronIcon open={isExpanded} />
                </button>
              ) : (
                <a
                  href={link.href}
                  className={`flex min-h-[64px] items-center justify-between px-7 text-lg font-medium sm:text-xl ${
                    isActive ? 'bg-brand-primary text-white' : 'text-text-primary hover:bg-surface-muted'
                  }`}
                >
                  {link.label}
                  <ChevronIcon />
                </a>
              )}

              {hasSections && isExpanded && (
                <div className="border-t-2 border-text-primary bg-surface-muted/40 px-7 py-6">
                  {link.sections!.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-6 last:mb-0">
                      {section.title && (
                        <h3 className="mb-3 text-xl font-bold text-brand-primary sm:text-2xl">
                          {section.title}
                        </h3>
                      )}
                      <ul>
                        {section.links.map((sectionLink, linkIndex) => (
                          <li key={linkIndex} className="mb-3 last:mb-0">
                            <a
                              href={sectionLink.href}
                              className="flex items-center gap-1.5 text-lg text-text-primary hover:underline sm:text-xl"
                            >
                              {sectionLink.label}
                              {isExternalHref(sectionLink.href) && <ExternalLinkIcon />}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="px-7 py-[26px]">
        <a
          href={primaryActionHref}
          className="flex min-h-[60px] items-center justify-center rounded-button bg-brand-primary text-lg font-bold text-white"
        >
          {primaryActionLabel}
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
          dir="rtl"
          placeholder={searchLink.label}
          aria-label={searchLink.label}
          style={{ textAlign: 'right' }}
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

/** Absolute (http/https) links open outside the app, same as the reference design's marked-external items. */
function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M9 6h9v9M18 6L7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DropdownChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default MobileNavigation
