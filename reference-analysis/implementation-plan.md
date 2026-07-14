# Implementation Plan / Notes

## What already existed before this task

This app's public certificate page (`/e/:token`), employee schema, Supabase
RLS/RPC, token/QR generation, admin CRUD, and the majority of the visual
shell (header, mobile nav, footer, field list, status banner) were already
built in an earlier session on this same branch lineage, driven by a
separately-supplied, explicitly-sanitized visual specification document
(`health_certificate_visual_spec.md`) and four screenshots. That work is
reused as-is per "do not rebuild working functionality."

## What this task added

1. `src/config/publicNavigation.ts` — typed, classified inventory of the
   public page's local actions/anchors (print, settings, accessibility,
   digital-verification anchor, date-format preference options).
2. `AccessibilityToolbar` — turned from static labels into a real settings
   dropdown (Hijri/Gregorian date-preference) and a working large-text
   accessibility toggle.
3. `PublicTrustBanner` — added `id="digital-verification"` and hash-based
   auto-open so `#digital-verification` behaves as a real local anchor
   (mirrors the reference's `#collapseDigitalStamp` pattern without the
   token).
4. `ReadOnlyField` / `CertificateFieldList` — added optional `highlighted`
   and `largeText` props so the date-preference and accessibility toggles
   have a visible effect **without ever reordering or hiding the required
   17-field order**.
5. `PublicEmployeePage` — wired the new state, added a print button
   (`window.print()`), hidden via `print:hidden` on all chrome regions
   (trust banner, toolbar, header, footer, print button itself) so printing
   shows only the certificate content.
6. Tests: `publicNavigation.test.ts`, `CertificateFieldList.test.tsx`,
   `PublicTrustBanner.test.tsx`, and additions to
   `PublicEmployeePage.test.tsx` (two employees render different data/QR
   URLs, print action calls `window.print`).
7. This `reference-analysis/` documentation set.
8. Visual QA screenshots under `visual-output/public-certificate/`.

## Explicitly out of scope for this task (and why)

- Renaming the existing component tree to match the reference's suggested
  names (`EmployeeCertificatePublicPage`, `CertificatePageHeader`, etc.).
  The existing components (`PublicHeader`, `MobileNavigation`,
  `CertificateFieldList`, `CertificateStatusBanner`, `PublicFooter`,
  `AccessibilityToolbar`, `PublicTrustBanner`) are functionally equivalent;
  renaming them would be pure churn with no behavioral benefit and risks
  breaking existing tests for no gain.
- Reproducing the real Balady logo, the DGA digital-stamp verification
  badge/link, the Vision 2030 logo, or any `balady.gov.sa`/
  `apps.balady.gov.sa`/`business.balady.sa`/`momah.gov.sa` navigation
  destinations. See `link-mapping.md`.
- A third-party accessibility-widget integration (the reference's
  "أدوات سهولة الوصول" trigger appears to load an external accessibility
  overlay script) — replaced with a simple, honest, self-contained
  large-text toggle instead.
- Notification settings and global search — no such features exist
  elsewhere in this app; no destinations or endpoints were invented for
  them.
- No Supabase schema migration was needed — see `field-mapping.md`.
