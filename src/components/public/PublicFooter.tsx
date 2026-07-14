import { footerLinks as defaultFooterLinks } from '../../config/siteLinks'
import Logo from '../brand/Logo'
import { useSiteSettings } from '../../features/settings/useSiteSettings'

function PublicFooter() {
  const {
    footerLinks,
    footerBadges,
    footerCopyrightText,
    footerSupportText,
    footerBadgeSize = 56,
  } = useSiteSettings()
  const links = footerLinks.length ? footerLinks : defaultFooterLinks
  const copyrightText = footerCopyrightText.replace('{year}', String(new Date().getFullYear()))

  return (
    <footer className="mt-[48px] bg-footer-bg px-[24px] pt-[34px] pb-[28px] text-center text-footer-text print:hidden">
      <ul className="flex flex-wrap justify-center gap-x-[22px] gap-y-[14px]">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-[15px] font-normal underline underline-offset-4">
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-[34px] text-[16px] leading-[1.8] font-bold">{copyrightText}</p>
      <p className="mt-[23px] text-[15px] leading-[1.8] font-normal opacity-90">
        {footerSupportText}
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
        <Logo variant="inverted" size={footerBadgeSize} />
        {footerBadges.map((badge, index) => {
          const image = (
            <img
              src={badge.imageUrl ?? undefined}
              alt={badge.alt}
              style={{ height: footerBadgeSize }}
              className="w-auto object-contain"
            />
          )
          return badge.href ? (
            <a key={index} href={badge.href} target="_blank" rel="noopener noreferrer">
              {image}
            </a>
          ) : (
            <span key={index}>{image}</span>
          )
        })}
      </div>
    </footer>
  )
}

export default PublicFooter
