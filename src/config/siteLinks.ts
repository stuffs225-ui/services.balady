export type SiteNavLink = {
  label: string
  href: string
}

/**
 * Centralized link configuration for the public-facing pages.
 * All navigation and footer links must be sourced from here rather than
 * hardcoded across components.
 */
export const navLinks: SiteNavLink[] = [
  { label: 'عن النظام', href: '/about' },
  { label: 'الخدمات', href: '/services' },
  { label: 'الاستعلامات', href: '/inquiries' },
  { label: 'تواصل معنا', href: '/contact' },
]

export const primaryActionLink: SiteNavLink = {
  label: 'بوابة الأعمال التجريبية',
  href: '/business-portal',
}

export const searchLink: SiteNavLink = {
  label: 'بحث',
  href: '/search',
}

export const footerLinks: SiteNavLink[] = [
  { label: 'خريطة الموقع', href: '/sitemap' },
  { label: 'RSS', href: '/rss' },
  { label: 'شروط الاستخدام', href: '/terms' },
  { label: 'سياسة الخصوصية', href: '/privacy' },
]

/** "{year}" is replaced with the current year at render time. */
export const defaultFooterCopyrightText = 'جميع الحقوق محفوظة للجهة التجريبية © {year}'
export const defaultFooterSupportText = 'تم تطوير وتشغيل النسخة التجريبية لأغراض العرض'

export const siteIdentity = {
  nameAr: 'نظام الشهادات الصحية',
  nameEn: 'Health Certificate Mini System',
  demoLabel: 'نسخة تجريبية',
  demoDisclaimer: 'نسخة تجريبية غير تابعة لأي جهة حكومية',
}
