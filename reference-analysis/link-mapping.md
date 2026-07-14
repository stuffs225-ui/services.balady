# Link Mapping (from links.sanitized.json)

Every clickable element from the supplied `links.sanitized.json` is
classified below. **Real government domains are reported but not wired
into this app** — see rationale in `page-structure.md`.

| Element | Text | Original href | Classification | Implementation status |
|---|---|---|---|---|
| Logo (navbar-brand) | — | `https://balady.gov.sa/ar` | external, real gov domain | **Not implemented** — logo routes to this app's own `/` instead |
| "كيف تتحقق" | كيف تتحقق | `/e/{publicToken}#collapseDigitalStamp` | local anchor (tokenized) | Implemented as `#digital-verification` local disclosure, no token |
| Settings button | الإعدادات | none (JS) | action | Implemented — date-preference dropdown |
| Print dropdown item | الطباعة | none (JS) | action | Implemented — `window.print()` button on public page |
| Notification settings | ضبط إعدادات الإشعارات | none (JS) | action | **Not implemented** — no notification system in this app; no destination invented |
| Hijri date toggle | استخدام التاريخ الهجري | none (JS) | action | Implemented — `dateSettingOptions` in `publicNavigation.ts` |
| Gregorian date toggle | استخدام التاريخ الميلادي | none (JS) | action | Implemented — same as above |
| Accessibility trigger | أدوات سهولة الوصول | none (JS) | action | Implemented as a simple large-text toggle (no third-party widget reproduced) |
| DGA digital stamp | [redacted] | `https://raqmi.dga.gov.sa/platforms/DigitalStamp/ShowCertificate/{certificateId}` | external, real government verification authority | **Not implemented** — would falsely imply real DGA certification for fictional data |
| Site branding logo | — | `https://balady.gov.sa/ar` | external, real gov domain | **Not implemented** — see logo row above |
| Navbar toggle | Toggle navigation | none (JS) | action | Implemented — `MobileNavigation` open/close, `aria-expanded` |
| "عن بلدي" dropdown + 20 children (من نحن، الهيكل التنظيمي، الأنظمة واللوائح، …) | various | all `balady.gov.sa` subpaths | external, real gov domain | **Not implemented** — no equivalent content exists in this app; not invented |
| "الخدمات" dropdown + children (إدارة الطلبات، إصدار رخصة تجارية، إصدار شهادة صحية، …) | various | `apps.balady.gov.sa`, `balady.gov.sa/services/*` | external, real gov domain/service catalog | **Not implemented** — no destination invented |
| "تواصل معنا" dropdown + children | various | `momah.gov.sa`, `balady.gov.sa/ar/form/contact-us`, etc. | external, real gov domain | **Not implemented** |
| "بلدي أعمال" button | بلدي أعمال | `https://business.balady.sa/` | external, real gov domain | **Not implemented** — this app's existing `primaryActionLink` ("بوابة الأعمال التجريبية") already points to a local placeholder route instead |
| Search trigger/modal | بحث | `/e/{publicToken}#headerSearch`, `redirectToPortalSearch(...)` | local anchor (tokenized) + JS action | **Not implemented** — no search feature exists in this app yet; not invented |
| Advanced search | البحث المتقدم | `https://balady.gov.sa/solr-serach-v1` | external, real gov domain | **Not implemented** |
| Footer: خريطة الموقع | خريطة الموقع | `https://balady.gov.sa/ar/node/11293` | external, real gov domain | Local placeholder route `/sitemap` already existed in `siteLinks.ts` |
| Footer: RSS | RSS | `https://balady.gov.sa/en/rss.xml` | external, real gov domain | Local placeholder `/rss` already existed |
| Footer: شروط الاستخدام | شروط الاستخدام | `https://balady.gov.sa/ar/node/22490` | external, real gov domain | Local placeholder `/terms` already existed |
| Footer: رؤية 2030 logo | رؤية 2030 | `https://www.vision2030.gov.sa/` | external, real gov domain | **Not implemented** — no equivalent trust-mark reproduced |
| Footer: DGA registration badge | مسجل لدى هيئة الحكومة الرقمية | `raqmi.dga.gov.sa/...` | external, real government registration mark | **Not implemented** — same reasoning as the DGA row above |
| Accessibility widget trigger button | (icon only) | none (JS) | action | **Not implemented** — third-party widget, out of scope |

## Summary

- **Clickable elements discovered in the supplied inventory: 65** (indices 0–64).
- **Mapped/implemented in this app: 8** (كيف تتحقق, settings menu, print,
  Hijri/Gregorian toggles, accessibility toggle, nav toggle, footer
  placeholder links already present from earlier work).
- **Not mapped, with reason "no destination detected" / real-gov-domain
  exclusion: remainder** — every one of them was either (a) a real
  `balady.gov.sa`/`apps.balady.gov.sa`/`business.balady.sa`/`momah.gov.sa`/
  `raqmi.dga.gov.sa`/`vision2030.gov.sa` destination that this independent
  demo has no legitimate reason to link to, or (b) a JS-only action
  (notifications, advanced search, accessibility widget) with no
  corresponding feature in this app, so no destination was invented for it.

All destinations this app *does* use are stored in `src/config/siteLinks.ts`
(general nav/footer) and `src/config/publicNavigation.ts` (public-page
local actions/anchors) — nothing is hardcoded inside components.
