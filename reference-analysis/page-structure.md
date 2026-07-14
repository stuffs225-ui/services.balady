# Reference Page Structure Analysis

Source: locally supplied `sanitized-reference/` package (HTML/CSS/JS snapshot +
`employee-fields.sanitized.json` + `links.sanitized.json`). The live reference
site was never fetched, crawled, or navigated to during this work — see
"What was intentionally not reproduced" below.

## Visible hierarchy (as implemented in this app)

```
PublicEmployeePage
├── PublicTrustBanner          (#digital-verification anchor target)
│    ├── demo disclaimer text
│    └── "كيف تتحقق" disclosure toggle
├── AccessibilityToolbar
│    ├── "الإعدادات" dropdown (Hijri/Gregorian date-preference toggle)
│    └── "أدوات سهولة الوصول" toggle (large-text mode)
├── PublicHeader
│    ├── Logo + system name + demo label
│    ├── Hamburger toggle (aria-expanded, Escape-to-close)
│    └── MobileNavigation (collapsible)
├── main
│    ├── PublicPageTitle
│    ├── CertificateStatusBanner (active/expiring/expired/revoked)
│    ├── EmployeePortrait
│    ├── CertificateFieldList (17 ReadOnlyField rows, exact order)
│    └── Print button (window.print(), hidden in print media)
└── PublicFooter (links, copyright, support line, logo)
```

## Structural observations reused from the reference

- Top disclaimer/trust region above a settings/accessibility toolbar, above
  the main header — reproduced as three stacked regions in that order.
- Header: logo at one side, hamburger at the other, no shadow, no card.
- Mobile nav: collapsible, full-width rows, active-row full-bleed color
  treatment, primary action as a wide button, search as a trailing row.
- Single-column content at all breakpoints up to tablet; centered, capped
  width container on desktop (no multi-column certificate fields).
- Field pattern: bold label above a bordered, muted-background read-only
  value box, right-aligned in RTL.
- Footer: dark solid background, centered link row, bold copyright line,
  lighter support line, no top radius.
- A local "how to verify" disclosure near the top of the page, and a
  settings affordance for a date-format preference.

These proportions/spacing were already captured quantitatively in
`health_certificate_visual_spec.md` (from an earlier, explicitly-sanitized
screenshot-based spec) and were implemented before this task; this pass
only added the interactive pieces (date preference, accessibility toggle,
print action, digital-verification anchor) that weren't in scope earlier.

## What was intentionally not reproduced

- The reference HTML still contained the real Balady government logo
  (base64-embedded SVG) and CDN logo references. Not used — this app uses
  its own independent placeholder mark (`src/components/brand/Logo.tsx`).
- `links.sanitized.json` is dominated by real `balady.gov.sa`,
  `apps.balady.gov.sa`, `business.balady.sa`, `raqmi.dga.gov.sa` (Digital
  Government Authority certificate-verification badge), and
  `vision2030.gov.sa` URLs. None of these were wired into this app's nav
  or footer — doing so would make an entirely fictional demo carry
  genuine-looking official government trust badges/registration, which is
  explicit impersonation risk regardless of the employee-data sanitization.
  See `link-mapping.md` for the full classification.
- No vendor CSS/JS (Bootstrap, Select2, FontAwesome, the accessibility
  widget trigger, preloader script) was copied in; this app already uses
  Tailwind v4 for all styling.
- The live reference URL was never fetched, navigated to, or crawled.
