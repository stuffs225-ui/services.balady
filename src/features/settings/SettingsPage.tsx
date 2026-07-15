import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../components/brand/Logo'
import { getSiteSettings, getBrandingAssetUrl, updateSiteSettings, uploadBrandingAsset } from './api'
import {
  navLinks as defaultNavLinks,
  footerLinks as defaultFooterLinks,
  defaultFooterCopyrightText,
  defaultFooterSupportText,
  siteIdentity,
} from '../../config/siteLinks'
import type { NavLinkSetting, NavMenuSection, FooterBadgeSetting } from '../../types/database'

type BadgeDraft = {
  file: File | null
  previewUrl: string | null
  imagePath: string | null
  alt: string
  href: string
}

/**
 * Drops blank sections/sub-links before saving, and keeps a nav link only
 * if it has a label plus either a direct href or at least one populated
 * dropdown section — a dropdown-style item never needs its own href.
 */
function cleanNavLinks(links: NavLinkSetting[]): NavLinkSetting[] {
  return links
    .map((link) => {
      const sections = (link.sections ?? [])
        .map((section) => ({
          title: section.title.trim(),
          links: section.links
            .map((sectionLink) => ({ label: sectionLink.label.trim(), href: sectionLink.href.trim() }))
            .filter((sectionLink) => sectionLink.label && sectionLink.href),
        }))
        .filter((section) => section.title && section.links.length > 0)

      return {
        label: link.label.trim(),
        href: link.href.trim(),
        ...(sections.length > 0 ? { sections } : {}),
      }
    })
    .filter((link) => link.label && (link.href || Boolean(link.sections?.length)))
}

function toBadgeDrafts(badges: FooterBadgeSetting[]): BadgeDraft[] {
  return badges.map((badge) => ({
    file: null,
    previewUrl: getBrandingAssetUrl(badge.imagePath),
    imagePath: badge.imagePath,
    alt: badge.alt,
    href: badge.href ?? '',
  }))
}

function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoLinkHref, setLogoLinkHref] = useState('')
  const [navLinks, setNavLinks] = useState<NavLinkSetting[]>([])
  const [footerLinks, setFooterLinks] = useState<NavLinkSetting[]>([])
  const [badges, setBadges] = useState<BadgeDraft[]>([])
  const [footerCopyrightText, setFooterCopyrightText] = useState('')
  const [footerSupportText, setFooterSupportText] = useState('')
  const [trustBannerText, setTrustBannerText] = useState('')
  const [accessibilityLinkHref, setAccessibilityLinkHref] = useState('')
  const [headerTitleText, setHeaderTitleText] = useState('')
  const [headerSubtitleText, setHeaderSubtitleText] = useState('')
  const [logoSize, setLogoSize] = useState(96)
  const [footerBadgeSize, setFooterBadgeSize] = useState(56)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const settings = await getSiteSettings()
        if (cancelled) return
        setLogoPreview(getBrandingAssetUrl(settings?.logo_path ?? null))
        setLogoLinkHref(settings?.logo_link_href ?? '')
        // Seed the editor with what visitors currently see (the static
        // defaults) when no admin-configured links have been saved yet, so
        // there's always something to edit rather than a blank list.
        setNavLinks(settings?.nav_links?.length ? settings.nav_links : defaultNavLinks)
        setFooterLinks(settings?.footer_links?.length ? settings.footer_links : defaultFooterLinks)
        setBadges(toBadgeDrafts(settings?.footer_badges ?? []))
        setFooterCopyrightText(settings?.footer_copyright_text || defaultFooterCopyrightText)
        setFooterSupportText(settings?.footer_support_text || defaultFooterSupportText)
        setTrustBannerText(settings?.trust_banner_text || siteIdentity.demoDisclaimer)
        setAccessibilityLinkHref(settings?.accessibility_link_href ?? '')
        setHeaderTitleText(settings?.header_title_text || siteIdentity.nameAr)
        setHeaderSubtitleText(settings?.header_subtitle_text || `(${siteIdentity.demoLabel})`)
        setLogoSize(settings?.logo_size || 96)
        setFooterBadgeSize(settings?.footer_badge_size || 56)
      } catch {
        if (!cancelled) {
          setMessage({ kind: 'error', text: 'تعذر تحميل الإعدادات، يرجى تحديث الصفحة' })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function updateNavLink(index: number, patch: Partial<NavLinkSetting>) {
    setNavLinks((prev) => prev.map((link, i) => (i === index ? { ...link, ...patch } : link)))
  }

  function updateNavLinkSections(
    navIndex: number,
    updater: (sections: NavMenuSection[]) => NavMenuSection[],
  ) {
    setNavLinks((prev) =>
      prev.map((link, i) => (i === navIndex ? { ...link, sections: updater(link.sections ?? []) } : link)),
    )
  }

  function addNavLinkSection(navIndex: number) {
    updateNavLinkSections(navIndex, (sections) => [...sections, { title: '', links: [] }])
  }

  function removeNavLinkSection(navIndex: number, sectionIndex: number) {
    updateNavLinkSections(navIndex, (sections) => sections.filter((_, i) => i !== sectionIndex))
  }

  function updateNavLinkSectionTitle(navIndex: number, sectionIndex: number, title: string) {
    updateNavLinkSections(navIndex, (sections) =>
      sections.map((section, i) => (i === sectionIndex ? { ...section, title } : section)),
    )
  }

  function addSectionLink(navIndex: number, sectionIndex: number) {
    updateNavLinkSections(navIndex, (sections) =>
      sections.map((section, i) =>
        i === sectionIndex ? { ...section, links: [...section.links, { label: '', href: '' }] } : section,
      ),
    )
  }

  function updateSectionLink(
    navIndex: number,
    sectionIndex: number,
    linkIndex: number,
    patch: { label?: string; href?: string },
  ) {
    updateNavLinkSections(navIndex, (sections) =>
      sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              links: section.links.map((link, li) => (li === linkIndex ? { ...link, ...patch } : link)),
            }
          : section,
      ),
    )
  }

  function removeSectionLink(navIndex: number, sectionIndex: number, linkIndex: number) {
    updateNavLinkSections(navIndex, (sections) =>
      sections.map((section, i) =>
        i === sectionIndex ? { ...section, links: section.links.filter((_, li) => li !== linkIndex) } : section,
      ),
    )
  }

  function updateFooterLink(index: number, patch: Partial<NavLinkSetting>) {
    setFooterLinks((prev) => prev.map((link, i) => (i === index ? { ...link, ...patch } : link)))
  }

  function updateBadge(index: number, patch: Partial<BadgeDraft>) {
    setBadges((prev) => prev.map((badge, i) => (i === index ? { ...badge, ...patch } : badge)))
  }

  function handleBadgeFileChange(index: number, file: File | undefined) {
    if (!file) return
    updateBadge(index, { file, previewUrl: URL.createObjectURL(file) })
  }

  async function handleSave() {
    setMessage(null)
    setIsSaving(true)

    try {
      let logoPath: string | null | undefined = undefined
      if (logoFile) {
        logoPath = await uploadBrandingAsset(logoFile, 'logo')
      }

      const resolvedBadges: FooterBadgeSetting[] = []
      for (const badge of badges) {
        let imagePath = badge.imagePath
        if (badge.file) {
          imagePath = await uploadBrandingAsset(badge.file, 'badges')
        }
        if (!imagePath) continue
        resolvedBadges.push({ imagePath, alt: badge.alt, href: badge.href || null })
      }

      await updateSiteSettings({
        ...(logoPath !== undefined ? { logo_path: logoPath } : {}),
        logo_link_href: logoLinkHref || null,
        nav_links: cleanNavLinks(navLinks),
        footer_links: footerLinks.filter((link) => link.label && link.href),
        footer_badges: resolvedBadges,
        footer_copyright_text: footerCopyrightText,
        footer_support_text: footerSupportText,
        trust_banner_text: trustBannerText,
        accessibility_link_href: accessibilityLinkHref || null,
        header_title_text: headerTitleText,
        header_subtitle_text: headerSubtitleText,
        logo_size: logoSize,
        footer_badge_size: footerBadgeSize,
      })

      setMessage({ kind: 'success', text: 'تم حفظ الإعدادات بنجاح' })
      setLogoFile(null)
    } catch {
      setMessage({ kind: 'error', text: 'تعذر حفظ الإعدادات، يرجى المحاولة مرة أخرى' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p className="text-text-secondary">جارٍ التحميل...</p>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-bold text-heading">الإعدادات</h1>

      {message && (
        <p
          className={`mb-6 rounded-field px-4 py-3 text-sm font-bold ${
            message.kind === 'success'
              ? 'bg-brand-primary-soft/20 text-brand-primary'
              : 'bg-red-50 text-expired'
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="mb-8 border-b border-divider pb-8">
        <h2 className="mb-4 font-bold text-heading">قالب بطاقة الموظف</h2>
        <p className="mb-4 text-sm text-text-secondary">
          ارفع صورة خلفية البطاقة المطبوعة وعايِر مواضع البيانات (الاسم، الصورة، الكيو آر، وبقية
          الحقول) فوقها.
        </p>
        <Link
          to="/settings/employee-card-template"
          className="inline-block rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
        >
          فتح إعدادات قالب البطاقة
        </Link>
      </section>

      <section className="mb-8 border-b border-divider pb-8">
        <h2 className="mb-4 font-bold text-heading">الشريط العلوي وأدوات الوصول</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-bold text-text-primary">
            الجملة الظاهرة أعلى الصفحة العامة
          </label>
          <input
            value={trustBannerText}
            onChange={(event) => setTrustBannerText(event.target.value)}
            className="w-full rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-text-primary">
            رابط "أدوات سهولة الوصول" (اختياري — إذا تُرك فارغًا يبقى زر تكبير الخط الحالي)
          </label>
          <input
            value={accessibilityLinkHref}
            onChange={(event) => setAccessibilityLinkHref(event.target.value)}
            placeholder="https://example.com/accessibility"
            dir="ltr"
            className="w-full rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="mb-8 border-b border-divider pb-8">
        <h2 className="mb-4 font-bold text-heading">اسم النظام (يظهر لدى المشرفين فقط)</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-bold text-text-primary">
            اسم النظام (السطر الأول)
          </label>
          <input
            value={headerTitleText}
            onChange={(event) => setHeaderTitleText(event.target.value)}
            className="w-full rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-text-primary">
            النص الفرعي (السطر الثاني)
          </label>
          <input
            value={headerSubtitleText}
            onChange={(event) => setHeaderSubtitleText(event.target.value)}
            className="w-full rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="mb-8 border-b border-divider pb-8">
        <h2 className="mb-4 font-bold text-heading">الشعار</h2>
        <div className="mb-4 flex items-center gap-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="الشعار الحالي"
              style={{ height: logoSize, width: 'auto' }}
              className="object-contain"
            />
          ) : (
            <Logo size={logoSize} />
          )}
          <input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" onChange={handleLogoChange} />
        </div>
        <label className="mb-1 block text-sm font-bold text-text-primary">
          حجم الشعار في أعلى الصفحة العامة: <span dir="ltr">{logoSize}px</span>
        </label>
        <input
          type="range"
          min={40}
          max={200}
          step={4}
          value={logoSize}
          onChange={(event) => setLogoSize(Number(event.target.value))}
          className="w-full"
        />
        <div className="mt-4">
          <label className="mb-1 block text-sm font-bold text-text-primary">
            الرابط عند الضغط على الشعار (اختياري — إذا تُرك فارغًا يبقى الشعار غير قابل للنقر)
          </label>
          <input
            value={logoLinkHref}
            onChange={(event) => setLogoLinkHref(event.target.value)}
            placeholder="https://example.com"
            dir="ltr"
            className="w-full rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="mb-8 border-b border-divider pb-8">
        <h2 className="mb-4 font-bold text-heading">حجم بادجات الفوتر</h2>
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-field border border-divider bg-footer-bg p-4">
          <Logo variant="inverted" size={footerBadgeSize} />
          {badges.map((badge, index) =>
            badge.previewUrl ? (
              <img
                key={index}
                src={badge.previewUrl}
                alt=""
                style={{ height: footerBadgeSize }}
                className="w-auto object-contain"
              />
            ) : null,
          )}
        </div>
        <label className="mb-1 block text-sm font-bold text-text-primary">
          حجم شعار وبادجات الفوتر: <span dir="ltr">{footerBadgeSize}px</span>
        </label>
        <input
          type="range"
          min={24}
          max={160}
          step={4}
          value={footerBadgeSize}
          onChange={(event) => setFooterBadgeSize(Number(event.target.value))}
          className="w-full"
        />
      </section>

      <section className="mb-8 border-b border-divider pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-heading">روابط القائمة الرئيسية</h2>
          <button
            type="button"
            onClick={() => setNavLinks((prev) => [...prev, { label: '', href: '' }])}
            className="rounded-button border border-divider px-3 py-1.5 text-sm font-bold hover:bg-surface-muted"
          >
            إضافة رابط
          </button>
        </div>
        {navLinks.map((link, index) => {
          const hasSections = Boolean(link.sections?.length)

          return (
            <div key={index} className="mb-4 rounded-field border border-divider p-3">
              <div className="mb-3 flex gap-3">
                <input
                  value={link.label}
                  onChange={(event) => updateNavLink(index, { label: event.target.value })}
                  placeholder="النص"
                  className="w-1/3 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
                />
                {!hasSections && (
                  <input
                    value={link.href}
                    onChange={(event) => updateNavLink(index, { href: event.target.value })}
                    placeholder="الرابط"
                    dir="ltr"
                    className="flex-1 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setNavLinks((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded-button border border-expired px-3 text-sm text-expired hover:bg-red-50"
                >
                  حذف
                </button>
              </div>

              {hasSections ? (
                <div className="rounded-field bg-surface-muted p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-text-secondary">
                      قائمة منسدلة — يظهر هذا بدل الرابط عند الضغط على "{link.label || 'هذا العنصر'}"
                    </p>
                    <button
                      type="button"
                      onClick={() => updateNavLink(index, { sections: undefined })}
                      className="text-xs font-bold text-expired hover:underline"
                    >
                      تحويل لرابط مباشر
                    </button>
                  </div>

                  {link.sections!.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-3 rounded-field border border-divider bg-surface p-3">
                      <div className="mb-2 flex gap-3">
                        <input
                          value={section.title}
                          onChange={(event) =>
                            updateNavLinkSectionTitle(index, sectionIndex, event.target.value)
                          }
                          placeholder="عنوان القسم"
                          className="flex-1 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => removeNavLinkSection(index, sectionIndex)}
                          className="rounded-button border border-expired px-3 text-sm text-expired hover:bg-red-50"
                        >
                          حذف القسم
                        </button>
                      </div>

                      {section.links.map((sectionLink, linkIndex) => (
                        <div key={linkIndex} className="mb-2 flex gap-3">
                          <input
                            value={sectionLink.label}
                            onChange={(event) =>
                              updateSectionLink(index, sectionIndex, linkIndex, {
                                label: event.target.value,
                              })
                            }
                            placeholder="نص الرابط"
                            className="w-1/3 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
                          />
                          <input
                            value={sectionLink.href}
                            onChange={(event) =>
                              updateSectionLink(index, sectionIndex, linkIndex, {
                                href: event.target.value,
                              })
                            }
                            placeholder="الرابط"
                            dir="ltr"
                            className="flex-1 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeSectionLink(index, sectionIndex, linkIndex)}
                            className="rounded-button border border-expired px-3 text-sm text-expired hover:bg-red-50"
                          >
                            حذف
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addSectionLink(index, sectionIndex)}
                        className="mt-1 rounded-button border border-divider px-3 py-1 text-xs font-bold hover:bg-surface-muted"
                      >
                        إضافة رابط للقسم
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addNavLinkSection(index)}
                    className="rounded-button border border-divider px-3 py-1.5 text-xs font-bold hover:bg-surface-muted"
                  >
                    إضافة قسم
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => addNavLinkSection(index)}
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  تحويل لقائمة منسدلة (تظهر عند الضغط بدل الانتقال لرابط)
                </button>
              )}
            </div>
          )
        })}
      </section>

      <section className="mb-8 border-b border-divider pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-heading">روابط الفوتر</h2>
          <button
            type="button"
            onClick={() => setFooterLinks((prev) => [...prev, { label: '', href: '' }])}
            className="rounded-button border border-divider px-3 py-1.5 text-sm font-bold hover:bg-surface-muted"
          >
            إضافة رابط
          </button>
        </div>
        {footerLinks.map((link, index) => (
          <div key={index} className="mb-3 flex gap-3">
            <input
              value={link.label}
              onChange={(event) => updateFooterLink(index, { label: event.target.value })}
              placeholder="النص"
              className="w-1/3 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
            />
            <input
              value={link.href}
              onChange={(event) => updateFooterLink(index, { href: event.target.value })}
              placeholder="الرابط"
              dir="ltr"
              className="flex-1 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setFooterLinks((prev) => prev.filter((_, i) => i !== index))}
              className="rounded-button border border-expired px-3 text-sm text-expired hover:bg-red-50"
            >
              حذف
            </button>
          </div>
        ))}
      </section>

      <section className="mb-8 border-b border-divider pb-8">
        <h2 className="mb-4 font-bold text-heading">نصوص الفوتر</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-bold text-text-primary">
            نص حقوق النشر (استخدم <span dir="ltr">{'{year}'}</span> ليتم استبداله بالسنة الحالية تلقائيًا)
          </label>
          <input
            value={footerCopyrightText}
            onChange={(event) => setFooterCopyrightText(event.target.value)}
            className="w-full rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-text-primary">نص الدعم</label>
          <input
            value={footerSupportText}
            onChange={(event) => setFooterSupportText(event.target.value)}
            className="w-full rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-heading">شعارات وبادجات الفوتر</h2>
          <button
            type="button"
            onClick={() =>
              setBadges((prev) => [...prev, { file: null, previewUrl: null, imagePath: null, alt: '', href: '' }])
            }
            className="rounded-button border border-divider px-3 py-1.5 text-sm font-bold hover:bg-surface-muted"
          >
            إضافة شعار
          </button>
        </div>
        {badges.map((badge, index) => (
          <div key={index} className="mb-4 flex flex-wrap items-center gap-3 rounded-field border border-divider p-3">
            {badge.previewUrl ? (
              <img src={badge.previewUrl} alt="" className="h-12 w-12 object-contain" />
            ) : (
              <div className="h-12 w-12 rounded bg-surface-muted" />
            )}
            <input
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={(event) => handleBadgeFileChange(index, event.target.files?.[0])}
              className="text-sm"
            />
            <input
              value={badge.alt}
              onChange={(event) => updateBadge(index, { alt: event.target.value })}
              placeholder="الوصف (alt)"
              className="w-40 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
            />
            <input
              value={badge.href}
              onChange={(event) => updateBadge(index, { href: event.target.value })}
              placeholder="رابط (اختياري)"
              dir="ltr"
              className="flex-1 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setBadges((prev) => prev.filter((_, i) => i !== index))}
              className="rounded-button border border-expired px-3 py-2 text-sm text-expired hover:bg-red-50"
            >
              حذف
            </button>
          </div>
        ))}
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-button bg-brand-primary px-6 py-3 font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60"
      >
        {isSaving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
      </button>
    </div>
  )
}

export default SettingsPage
