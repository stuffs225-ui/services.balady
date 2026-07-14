import { footerLinks } from '../../config/siteLinks'
import Logo from '../brand/Logo'

function PublicFooter() {
  return (
    <footer className="mt-auto bg-footer-bg px-7 pt-11 pb-12 text-center text-footer-text print:hidden sm:pt-14 sm:pb-[60px]">
      <ul className="flex flex-wrap justify-center gap-[22px] sm:gap-[34px]">
        {footerLinks.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-base underline underline-offset-4 sm:text-lg">
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-[17px] font-bold sm:mt-12 sm:text-xl">
        جميع الحقوق محفوظة للجهة التجريبية © {new Date().getFullYear()}
      </p>
      <p className="mt-2 text-[15px] font-normal opacity-90 sm:text-base">
        تم تطوير وتشغيل النسخة التجريبية لأغراض العرض
      </p>

      <div className="mt-9 flex justify-center sm:mt-11">
        <Logo variant="inverted" />
      </div>
    </footer>
  )
}

export default PublicFooter
