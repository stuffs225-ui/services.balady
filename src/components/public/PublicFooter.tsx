import { footerLinks as defaultFooterLinks } from '../../config/siteLinks'
import Logo from '../brand/Logo'
import { useSiteSettings } from '../../features/settings/useSiteSettings'

function PublicFooter() {
  const { footerLinks, footerBadges, footerCopyrightText, footerSupportText } = useSiteSettings()
  const links = footerLinks.length ? footerLinks : defaultFooterLinks
  const copyrightText = footerCopyrightText.replace('{year}', String(new Date().getFullYear()))

  return (
    <footer className="mt-auto bg-footer-bg px-7 pt-11 pb-12 text-center text-footer-text print:hidden sm:pt-14 sm:pb-[60px]">
      <ul className="flex flex-wrap justify-center gap-[22px] sm:gap-[34px]">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-base underline underline-offset-4 sm:text-lg">
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-[17px] font-bold sm:mt-12 sm:text-xl">{copyrightText}</p>
      <p className="mt-2 text-[15px] font-normal opacity-90 sm:text-base">{footerSupportText}</p>

      <div className="mt-9 flex flex-wrap justify-center gap-6 sm:mt-11">
        <Logo variant="inverted" />
        {footerBadges.map((badge, index) => {
          const image = (
            <img src={badge.imageUrl ?? undefined} alt={badge.alt} className="h-10 w-auto object-contain" />
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
