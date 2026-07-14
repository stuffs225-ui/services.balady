/**
 * Classified link/action inventory for the public certificate page.
 * Every destination or in-page action the page can trigger is declared
 * here rather than hardcoded inside components.
 *
 * kind:
 *  - "internal"     -> react-router route inside this app
 *  - "local-anchor"  -> scrolls to an in-page section (no navigation)
 *  - "action"        -> triggers local UI behavior, no destination URL
 *
 * This app has no real external destinations to link to (no live
 * "about"/"services" pages exist yet), so nothing here points off-app.
 * Reference-page items that pointed at real government domains are
 * intentionally not reproduced — see project README for why.
 */

export type PublicNavItem =
  | { label: string; kind: 'internal'; href: string }
  | { label: string; kind: 'local-anchor'; href: string }
  | { label: string; kind: 'action'; action: 'print' | 'toggle-settings' | 'toggle-accessibility' }

export const publicNavItems: PublicNavItem[] = [
  { label: 'الرئيسية', kind: 'internal', href: '/' },
  { label: 'الإعدادات', kind: 'action', action: 'toggle-settings' },
  { label: 'أدوات سهولة الوصول', kind: 'action', action: 'toggle-accessibility' },
  { label: 'الطباعة', kind: 'action', action: 'print' },
]

export type DatePreference = 'hijri' | 'gregorian'

export const dateSettingOptions: Array<{ label: string; value: DatePreference }> = [
  { label: 'استخدام التاريخ الهجري', value: 'hijri' },
  { label: 'استخدام التاريخ الميلادي', value: 'gregorian' },
]
