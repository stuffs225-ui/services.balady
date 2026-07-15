import { useEffect, useState } from 'react'
import { getSiteSettings, getBrandingAssetUrl, getEmployeeCardTemplateUrl } from './api'
import {
  navLinks as defaultNavLinks,
  footerLinks as defaultFooterLinks,
  defaultFooterCopyrightText,
  defaultFooterSupportText,
  siteIdentity,
} from '../../config/siteLinks'
import { mergeEmployeeCardLayout } from '../../config/employeeCardLayout'
import { mergeEmployeeFormFieldStyles } from '../../config/employeeFormFields'
import type { EmployeeCardLayout, EmployeeFormFieldStyles, NavLinkSetting } from '../../types/database'

export type ResolvedFooterBadge = {
  imageUrl: string | null
  alt: string
  href: string | null
}

export type ResolvedSiteBranding = {
  logoUrl: string | null
  navLinks: NavLinkSetting[]
  footerLinks: NavLinkSetting[]
  footerBadges: ResolvedFooterBadge[]
  footerCopyrightText: string
  footerSupportText: string
  trustBannerText: string
  accessibilityLinkHref: string | null
  headerTitleText: string
  headerSubtitleText: string
  logoSize: number
  footerBadgeSize: number
  employeeCardTemplateUrl: string | null
  employeeCardBackTemplateUrl: string | null
  employeeCardLayout: EmployeeCardLayout
  employeeFormFieldStyles: EmployeeFormFieldStyles
  isLoading: boolean
}

/**
 * Reads editable branding/navigation from the database, falling back to the
 * static defaults in src/config/siteLinks.ts until an admin sets their own
 * values (or if the settings row can't be reached).
 */
export function useSiteSettings(): ResolvedSiteBranding {
  const [state, setState] = useState<ResolvedSiteBranding>({
    logoUrl: null,
    navLinks: defaultNavLinks,
    footerLinks: defaultFooterLinks,
    footerBadges: [],
    footerCopyrightText: defaultFooterCopyrightText,
    footerSupportText: defaultFooterSupportText,
    trustBannerText: siteIdentity.demoDisclaimer,
    accessibilityLinkHref: null,
    headerTitleText: siteIdentity.nameAr,
    headerSubtitleText: `(${siteIdentity.demoLabel})`,
    logoSize: 96,
    footerBadgeSize: 56,
    employeeCardTemplateUrl: null,
    employeeCardBackTemplateUrl: null,
    employeeCardLayout: mergeEmployeeCardLayout(null),
    employeeFormFieldStyles: mergeEmployeeFormFieldStyles(null),
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const settings = await getSiteSettings()
        if (cancelled) return

        setState({
          logoUrl: getBrandingAssetUrl(settings?.logo_path ?? null),
          navLinks: settings?.nav_links?.length ? settings.nav_links : defaultNavLinks,
          footerLinks: settings?.footer_links?.length ? settings.footer_links : defaultFooterLinks,
          footerBadges: (settings?.footer_badges ?? []).map((badge) => ({
            imageUrl: getBrandingAssetUrl(badge.imagePath),
            alt: badge.alt,
            href: badge.href,
          })),
          footerCopyrightText: settings?.footer_copyright_text || defaultFooterCopyrightText,
          footerSupportText: settings?.footer_support_text || defaultFooterSupportText,
          trustBannerText: settings?.trust_banner_text || siteIdentity.demoDisclaimer,
          accessibilityLinkHref: settings?.accessibility_link_href ?? null,
          headerTitleText: settings?.header_title_text || siteIdentity.nameAr,
          headerSubtitleText: settings?.header_subtitle_text || `(${siteIdentity.demoLabel})`,
          logoSize: settings?.logo_size || 96,
          footerBadgeSize: settings?.footer_badge_size || 56,
          employeeCardTemplateUrl: getEmployeeCardTemplateUrl(
            settings?.employee_card_template_path ?? null,
          ),
          employeeCardBackTemplateUrl: getEmployeeCardTemplateUrl(
            settings?.employee_card_back_template_path ?? null,
          ),
          employeeCardLayout: mergeEmployeeCardLayout(settings?.employee_card_layout),
          employeeFormFieldStyles: mergeEmployeeFormFieldStyles(
            settings?.employee_form_field_styles,
          ),
          isLoading: false,
        })
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, isLoading: false }))
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
