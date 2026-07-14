import { useEffect, useState } from 'react'
import Logo from '../../components/brand/Logo'
import { getSiteSettings, getBrandingAssetUrl, updateSiteSettings, uploadBrandingAsset } from './api'
import {
  navLinks as defaultNavLinks,
  footerLinks as defaultFooterLinks,
  defaultFooterCopyrightText,
  defaultFooterSupportText,
} from '../../config/siteLinks'
import type { NavLinkSetting, FooterBadgeSetting } from '../../types/database'

type BadgeDraft = {
  file: File | null
  previewUrl: string | null
  imagePath: string | null
  alt: string
  href: string
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
  const [navLinks, setNavLinks] = useState<NavLinkSetting[]>([])
  const [footerLinks, setFooterLinks] = useState<NavLinkSetting[]>([])
  const [badges, setBadges] = useState<BadgeDraft[]>([])
  const [footerCopyrightText, setFooterCopyrightText] = useState('')
  const [footerSupportText, setFooterSupportText] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      const settings = await getSiteSettings()
      if (cancelled) return
      setLogoPreview(getBrandingAssetUrl(settings?.logo_path ?? null))
      // Seed the editor with what visitors currently see (the static
      // defaults) when no admin-configured links have been saved yet, so
      // there's always something to edit rather than a blank list.
      setNavLinks(settings?.nav_links?.length ? settings.nav_links : defaultNavLinks)
      setFooterLinks(settings?.footer_links?.length ? settings.footer_links : defaultFooterLinks)
      setBadges(toBadgeDrafts(settings?.footer_badges ?? []))
      setFooterCopyrightText(settings?.footer_copyright_text || defaultFooterCopyrightText)
      setFooterSupportText(settings?.footer_support_text || defaultFooterSupportText)
      setIsLoading(false)
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
        nav_links: navLinks.filter((link) => link.label && link.href),
        footer_links: footerLinks.filter((link) => link.label && link.href),
        footer_badges: resolvedBadges,
        footer_copyright_text: footerCopyrightText,
        footer_support_text: footerSupportText,
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
        <h2 className="mb-4 font-bold text-heading">الشعار</h2>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="الشعار الحالي" className="h-16 w-16 object-contain" />
          ) : (
            <Logo />
          )}
          <input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" onChange={handleLogoChange} />
        </div>
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
        {navLinks.map((link, index) => (
          <div key={index} className="mb-3 flex gap-3">
            <input
              value={link.label}
              onChange={(event) => updateNavLink(index, { label: event.target.value })}
              placeholder="النص"
              className="w-1/3 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
            />
            <input
              value={link.href}
              onChange={(event) => updateNavLink(index, { href: event.target.value })}
              placeholder="الرابط"
              dir="ltr"
              className="flex-1 rounded-field border border-input-border bg-input-bg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setNavLinks((prev) => prev.filter((_, i) => i !== index))}
              className="rounded-button border border-expired px-3 text-sm text-expired hover:bg-red-50"
            >
              حذف
            </button>
          </div>
        ))}
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
