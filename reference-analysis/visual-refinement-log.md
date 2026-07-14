# Visual Refinement Log — Public Certificate Page Pixel Match

Three refinement passes performed, each followed by screenshot capture and
either measurement or visual comparison. Screenshots saved under
`visual-output/public-certificate-pixel-match/`.

## Pass 1 — Apply target values from `current-vs-target-audit.md`

**Changes made:**
- Added scoped design tokens (`--color-public-body`, `--color-field-value`,
  `--color-field-border`, `--color-field-bg`) and updated `--color-footer-bg`
  to `#185333`, without touching shared admin/login tokens.
- `PublicPageTitle`: 31px/700/1.28, `max-width: 340px`, `margin-top: 28px`,
  removed the inline demo-label subtitle line (disclaimer already lives in
  the trust banner).
- `CertificateStatusBanner`: reduced top margin (`mt-6` → `mt-4`), 13px on
  mobile.
- `EmployeePortrait`: fixed `184×184px` (was a fluid `clamp(180px,52vw,210px)`),
  margin `30px auto 28px`.
- `ReadOnlyField`: field height 44px, padding `8px 14px`, 1px border, 17px
  value / 16px label (15px for the 5 long date/program labels via a
  26-character length threshold), label margin 8px, field group margin 21px,
  empty-value dash changed from `—` to `–`.
- `CertificateFieldList`: width capped at `max-width: 350px` below `md:`,
  `720px` at `md:` and above.
- `PublicHeader`: `min-height: 78px`, logo shrunk to 32px, tighter padding.
- `PublicTrustBanner`: `min-height: 108px`, `padding: 14px 20px 12px`,
  13px/1.5 disclaimer text, lighter gray background.
- Print action moved from a standalone button in the main content flow into
  the settings dropdown (`AccessibilityToolbar`), alongside the existing
  Hijri/Gregorian toggle.
- Removed `flex-1`/`mt-auto` on `main`/`footer` and the large
  `pb-[clamp(120px,18vh,220px)]` content padding, so the footer now follows
  the content instead of being pinned to the viewport bottom with a blank
  gap above it.
- `PublicFooter`: padding `34px 24px 28px`, `margin-top: 48px`, link gap
  `22px`/`14px` (horizontal/vertical), 15px links, 16px/700/1.8 copyright,
  15px/400/1.8 support line, 23px margin above the support line.

**Screenshots:** `verify-360.png`, `verify-390.png`, `verify-430.png`,
`verify-768.png`, `verify-desktop.png`.

**Remaining mismatches after Pass 1 (visual review):** none obvious at a
glance; proceeded to Pass 2 to verify with actual computed values rather
than eyeballing further.

## Pass 2 — Computed-style verification against numeric targets

Used Playwright to read `getComputedStyle()` on the live page (mocked data,
390px viewport) rather than comparing screenshots pixel-by-pixel.

**Measured vs. target:**

| Property | Measured | Target | Result |
|---|---|---|---|
| Field height | 44px | 44px | ✅ |
| Field padding | 8px 14px | 8px 14px | ✅ |
| Field border | 1px `#aab2bb` | 1px `#aab2bb` | ✅ |
| Field background | `#f5f5f5` | `#f5f5f5` | ✅ |
| Field group margin | 21px | 21px | ✅ |
| Label font-size | 16px | 16px | ✅ |
| Label font-weight | 700 | 700 | ✅ |
| Label margin-bottom | 8px | 8px | ✅ |
| Value font-size | 17px | 17px | ✅ |
| Value color | `#61676f` | `#61676f` | ✅ |
| Photo size | 184×184px | 184×184px | ✅ |
| Header height | 79px | 72–80px | ✅ |
| Trust banner height | 108px | 108px | ✅ |
| Footer padding | 34px / 28px | 34px / 28px | ✅ |
| Footer margin-top | 48px | 48px | ✅ |
| Footer background | `#185333` | `#185333` | ✅ |
| Title font-size/weight | 31px / 700 | 31px / 700 | ✅ |
| Title max-width | 340px | 340px | ✅ |
| Title margin-top | 28px | 28px | ✅ |
| Content width @390px | 334px | ~334–350px | ✅ |
| Accessibility bar height | 55.5px | 55–60px | ✅ |
| Long-label font-size | 15px | 15px | ✅ |
| Short-label font-size | 16px | 16px | ✅ |
| Empty-value glyph | `–` | `–` | ✅ |

**Remaining mismatches after Pass 2:** none against the numeric targets
themselves. However this pass surfaced a **functional/behavioral bug**, not
a spacing one — see Pass 3.

## Pass 3 — RTL alignment correctness + overflow check

**Bug found:** `ReadOnlyField`'s value container used
`dir === 'rtl' ? 'justify-end' : 'justify-start'`. For `dir="ltr"` fields
(all numeric/date fields — الهوية، الشهادة الصحية، التواريخ، الرخصة،
المنشأة) this pushed the value to the **left** edge of the box
(`justify-content: flex-start` in an LTR flex container = left), directly
violating "Values must visually sit on the right side... Do not left-align
values" and the numeric-field rule in target §12. This was not visible at
a casual screenshot glance because the field boxes are narrow and most
values are short, but was confirmed via computed style (`justifyContent:
"flex-start"`) and had been present since before this pass — introduced
when the alignment ternary was written, not something Pass 1 caused.

**Fix:** value container is now always `justify-end text-right`, regardless
of `dir`. `dir="ltr"` still governs character/number ordering (bidi) via
`unicode-bidi: plaintext`, but the box itself always right-aligns.

**Verified after fix:**
- `رقم الهوية` (dir=ltr) value: `justifyContent: "flex-end"` ✅
- No horizontal overflow at 360px or 390px (`scrollWidth <= clientWidth`) ✅
- Screenshot `verify-390-pass3-fixed.png` confirms all values, including
  masked ID and dates, sit flush right inside their fields.

## Summary

This is a **high-fidelity visual match** to every explicit numeric target
in the brief (confirmed via computed styles, not just visual inspection),
with one real alignment bug found and fixed during verification. Exact
pixel parity against the original live reference site was not attempted or
claimed — that site was never accessed, per the task's constraints; parity
here is against the numeric targets supplied in this task and the
project's own existing sanitized reference materials.

Remaining known deviations (documented, not hidden):
- Desktop/tablet (`768px`+) intentionally keeps the wider `720px` field
  cap rather than 350px, per target §19 ("preserve acceptable desktop
  behavior... prioritize mobile parity").
- Font stack remains `Tajawal, Noto Sans Arabic, system-ui, ...` (already
  in place site-wide) rather than switching to `Arial, Tahoma, sans-serif`
  as suggested in target §1 — changing the base font stack would affect
  every page (admin, login) sharing `--font-sans`, which the task's own
  constraints ask not to touch ("Do not modify unrelated admin pages").
  The existing font already satisfies the weight rules (400 body / 700
  labels) and is visually restrained, so it was kept rather than forking
  a second font stack for one page.
