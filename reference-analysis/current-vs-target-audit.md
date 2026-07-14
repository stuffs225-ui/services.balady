# Current vs. Target Audit — Public Certificate Page (`/e/:token`)

Audited before any changes in this pass. All values read directly from the
component source below (not estimated from a screenshot).

## Files audited

- `src/features/public/PublicEmployeePage.tsx` (page shell/composition)
- `src/components/public/PublicTrustBanner.tsx`
- `src/components/public/AccessibilityToolbar.tsx`
- `src/components/public/PublicHeader.tsx`
- `src/components/public/MobileNavigation.tsx`
- `src/components/public/PublicPageTitle.tsx`
- `src/components/public/CertificateStatusBanner.tsx`
- `src/components/public/EmployeePortrait.tsx`
- `src/components/public/ReadOnlyField.tsx`
- `src/components/public/CertificateFieldList.tsx`
- `src/components/public/PublicFooter.tsx`
- `src/components/public/VerificationLoadingState.tsx`
- `src/components/public/VerificationNotFoundState.tsx`
- `src/components/public/VerificationNetworkErrorState.tsx`
- `src/index.css` (`@theme` design tokens)
- `scripts/capture-screenshots.mjs` (visual QA harness)
- `src/features/public/PublicEmployeePage.test.tsx`, `src/components/public/CertificateFieldList.test.tsx`

## Current vs. target values

| Property | Current | Target | Verdict |
|---|---|---|---|
| Trust banner min-height | not fixed (~14px+16px padding + text) ≈ 90–100px | 108px | close, keep |
| Accessibility bar height | `py-4` (16px×2) + text ≈ 55–60px | 58px | already matches |
| Header height | `py-6` (24px×2) + 40px logo ≈ 88px | 78px | **too tall** |
| Header logo size | 40×40px (fixed in `Logo` SVG) | ~30–36px icon area | **too large** |
| Page title font-size | `31px` | `31px` | matches |
| Page title font-weight | `font-extrabold` (800) | `700` | **too heavy** |
| Page title max-width | `w-[85%]` / `sm:w-4/5` (%-based) | `340px` fixed | **wrong unit/too wide on large phones** |
| Page title margin-top | `mt-8` (32px) | `28px` | slightly high |
| Page title extra subtitle | `– نسخة تجريبية` second line inside `<h1>` | none (disclaimer lives in trust banner already) | **redundant, adds height** |
| Status badge | small pill, `text-sm` (14px), `py-1.5` | compact badge 13–14px, 28–32px height | already close; margin above it (`mt-6/7` = 24–28px) pushes total added height to ~56px | **margin too generous** |
| Employee photo size | `clamp(180px, 52vw, 210px)` (fluid, up to 210px) | fixed `184×184px` | **too large / not fixed** |
| Photo margin | `mt-6 mb-10` / `sm:mt-8 mb-12` (24–48px) | `30px auto 28px` | **too much bottom margin** |
| Content/field width | `min(calc(100% - 56px), 720px)` at all sizes | `calc(100% - 56px)`, **max-width 350px** on mobile | **stretches too wide on 390–430px phones** |
| Field label font-size | `text-[18px]` / `sm:text-xl` (20px) | `16px` (`15px` for 5 long date/program labels) | **too large** |
| Field label margin-bottom | `11px` | `8px` | slightly high |
| Field value min-height | `66px` | `44px` | **too tall** |
| Field value padding | `18px 13px` | `8px 14px` | **too much vertical padding** |
| Field value font-size | `20px` (`22px` large-text mode) | `17px` | **too large** |
| Field value border | `1.5px` | `1px` | slightly heavy |
| Field value color | `text-secondary` (`#535960`) | `#61676f` | close, not exact |
| Field border color | `input-border` (`#aeb4bb`) | `#aab2bb` | close, not exact |
| Field background | `input-bg` (`#f7f7f7`) | `#f5f5f5` | close, not exact |
| Field group spacing (`mb`) | `30px` | `21px` | **too much** |
| Print action | standalone centered button in main content flow, below fields | inside settings menu / compact, not interrupting flow | **wrong location per target** |
| Main content bottom padding | `pb-[clamp(120px,18vh,220px)]` on content wrapper, plus `mt-auto` on footer inside a `min-h-svh` flex column | footer follows content naturally, `margin-top: ~48px` | **creates a large artificial blank gap** |
| Footer background | `#204b33` | `#185333` | **off** |
| Footer padding | `pt-11 pb-12` / `sm:pt-14 pb-[60px]` (44–60px) | `34px 24px 28px` | **too generous** |
| Footer link gap | `gap-[22px]` both axes (`sm:gap-[34px]`) | `22px` horizontal / `14px` vertical (asymmetric) | **not asymmetric currently** |
| Footer link font-size | `text-base` (16px) / `sm:text-lg` (18px) | `15px` | **too large** |
| Footer copyright font-size | `17px` / `sm:20px` | `16px` | **too large** |
| Footer copyright margin-top | `mt-10` (40px) / `sm:mt-12` (48px) | `34px` | close |
| Footer support margin-top | `mt-2` (8px) | `23px` | **too small** |
| Footer support font-size | `15px` / `sm:16px` | `15px` | matches on mobile |

## Root causes identified (not screenshot guesswork — read from code)

1. `ReadOnlyField` and `CertificateFieldList` were tuned against an earlier,
   more spacious visual spec (`health_certificate_visual_spec.md` from an
   earlier task) that intentionally used taller fields (62–72px) and larger
   type (18–20px labels, 20px values). The new target in this task asks for
   a visibly denser, smaller-type layout instead.
2. `EmployeePortrait` uses a fluid `clamp()` size instead of the requested
   fixed 184px, so it grows on larger phones (390 vs. 430px) instead of
   staying visually constant.
3. `CertificateFieldList`'s width cap (720px) is a desktop-appropriate value
   applied unconditionally, stretching fields wider than intended on
   430–440px phones.
4. The print button lives inline in the page flow; the target wants it
   moved into the existing (currently unused for this) `الطباعة` action
   already declared in `src/config/publicNavigation.ts` but never wired to
   a click handler anywhere.
5. The footer's `mt-auto` inside a `min-h-svh` flex column, combined with a
   large `pb-[clamp(...)]` on the content wrapper, is what produces the
   large blank gap before the footer — not the footer's own spacing.

## Plan (kept scoped to the public page + its shared field/portrait/footer
components; no Supabase/RLS/token/QR/routing changes)

- Add new, narrowly-scoped design tokens (`--color-field-value`,
  `--color-field-border`, `--color-field-bg`, `--color-public-body`) rather
  than repurposing `--color-text-secondary` / `--color-input-border` /
  `--color-input-bg` / `--color-heading`, which are shared with the admin
  UI and login page and must not change.
- Update `--color-footer-bg` in place (confirmed used only by `PublicFooter`).
- Resize/retune `PublicPageTitle`, `EmployeePortrait`, `ReadOnlyField`,
  `CertificateFieldList`, `CertificateStatusBanner` margins, `PublicHeader`,
  and `PublicFooter` to the target numbers above.
- Add a "long label" rule (>26 chars) to `ReadOnlyField` for the 15px cases.
- Move the print action into `AccessibilityToolbar`'s settings menu; remove
  the standalone button from `PublicEmployeePage`.
- Remove the footer's `mt-auto` / content wrapper's oversized bottom padding.
