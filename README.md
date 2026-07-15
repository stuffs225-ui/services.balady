# نظام الشهادات الصحية (نسخة تجريبية)

## Health Certificate Mini System (Demo)

A lightweight MVP for issuing and publicly verifying health certificates via a
unique link and QR code. **This is an independent demo** — it is not
affiliated with, endorsed by, or a reproduction of any government service.
The public page uses a temporary demo identity, fictional sample data, and
displays a visible "نسخة تجريبية" (demo) disclaimer at all times.

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript (strict mode)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Supabase](https://supabase.com/) (Postgres, Auth, Storage)
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- [qrcode](https://www.npmjs.com/package/qrcode)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/) (visual verification only)

## Local setup

```bash
npm install
cp .env.example .env
# fill in .env with your own Supabase project values (see below)
npm run dev
```

## Environment variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable (anon) key |
| `VITE_APP_PUBLIC_URL` | The public base URL of this deployment, used to build `/e/:token` links and QR codes (e.g. `https://your-demo.vercel.app`, or `http://localhost:5173` locally) |

`.env` and all other local env files are git-ignored. **Never** commit real
values, and **never** put the Supabase **service role** key anywhere in
this project — only the publishable/anon key belongs in frontend code. The
app validates these variables at startup (`src/lib/supabase.ts`) and throws
a clear error if any are missing.

## Supabase setup

1. Create a new Supabase project.
2. Run the migrations in `supabase/migrations/` in order, either via the
   Supabase SQL editor (paste each file's contents and run) or with the
   Supabase CLI:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   This creates:
   - the `employees` table with an `updated_at` trigger
   - Row Level Security policies (authenticated admins only; no anonymous
     table access)
   - the `public.verify_certificate(p_token)` RPC — the **only** way
     anonymous visitors can read certificate data, and it returns exclusively
     public-safe, masked fields
   - the `employee-photos` storage bucket (made public by a later
     migration) and its access policies

### Storage

The `employee-photos` bucket is **public**, the same as `branding-assets`
(5 MB limit, JPG/PNG/WebP only). Photos are stored at the path
`<public_token>/photo` and served via a plain, permanent public Storage
URL — the exact same mechanism already used for the header logo, with no
signing, no expiry, and no server-side proxy. The object path is only
reachable if you already know the employee's `public_token` (128 bits of
entropy), which is the same token already required to view the rest of
the certificate at `/e/:token` — so this doesn't expose anything beyond
what that link already exposes.

### First admin user

This MVP has no public registration screen. Create the first admin manually:

1. In the Supabase dashboard, go to **Authentication → Users → Add user**.
2. Set an email and password (email-confirmed).
3. Sign in at `/login` with those credentials.

## Using the system

### Adding a new employee

1. Sign in, then go to **الموظفون → إضافة موظف جديد**.
2. Fill in the form (photo optional) and save.
3. On save, the app generates a cryptographically secure public token, a
   public URL, and a QR code, then redirects to the employee's detail page.

### The public link and QR code

- **Token**: generated client-side with the Web Crypto API — 128 bits of
  entropy, base64url-encoded (`src/lib/token.ts`). The database also has a
  safety-net default in case a row is ever inserted without one.
- **Public URL**: `${VITE_APP_PUBLIC_URL}/e/{public_token}` (`src/lib/publicUrl.ts`).
- **QR code**: encodes only that public URL, nothing else (`src/lib/qrcode.ts`).
- From the employee detail page or list, you can **copy the link**,
  **download the QR** as a PNG, or **open the public page** directly.

### Printing

Open an employee's **طباعة** page and use the print button (or your
browser's print command). Print styles hide all navigation/admin controls
and leave a clean certificate layout.

### Deactivating an employee

Use **إلغاء التفعيل** from the list or detail page. This sets `is_active =
false`; the public page then shows a "ملغاة" (revoked) status instead of
serving normal certificate data as valid, and the employee's photo becomes
unreadable to anonymous visitors.

### Editing branding and links (الإعدادات)

Go to **الإعدادات** from the admin header (`/settings`) to change, without a
code deploy:

- the logo shown on the login page, admin header, and public page
- the main navigation links (label + URL, add/remove any number)
- the footer links
- footer logos/badges (upload an image, optional link, optional alt text)
- the footer copyright text (use `{year}` to auto-insert the current year)
  and the footer support text

The nav/footer link editors are pre-filled with the current live values
(the static defaults, until you save your own) so you're always editing
what visitors actually see rather than starting from a blank form.

These are stored in the `site_settings` table and a public `branding-assets`
storage bucket (public by design — logos must render for every visitor with
no auth). Only authenticated admins can write to either; everyone can read.
Until you save your own values, the app falls back to the defaults in
`src/config/siteLinks.ts`.

## Testing

```bash
npm run lint        # ESLint
npm run typecheck   # tsc -b, strict mode, no emit
npm run test         # Vitest unit/component tests
npm run build        # production build
```

### Visual verification (optional)

`scripts/capture-screenshots.mjs` drives the built app with mocked
Supabase responses (no live project required) and captures the public page
at 360/390/430/768px and desktop widths into `visual-output/`:

```bash
npm run build
npm run preview -- --port 4173 &
SCREENSHOT_BASE_URL=http://localhost:4173 npm run screenshots
```

## Deploying to Vercel

- **Build command**: `npm run build`
- **Output directory**: `dist`
- Set the three environment variables above in the Vercel project settings.
- `vercel.json` rewrites every path to `index.html` so direct navigation to
  `/e/:token`, `/employees`, etc. works correctly on a fresh page load.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| App throws "Missing Supabase environment variables" | Ensure `.env` (local) or the Vercel project settings (deployed) define all three `VITE_*` variables. |
| Public page shows "تعذر التحقق من الشهادة" for a real token | Confirm migrations ran successfully and the employee's `is_active` is not relied upon — invalid/unknown tokens always show this generic message by design. |
| Employee photo doesn't load on the public page | Confirm migration `20260715100000_employee_photos_bucket_public.sql` ran (the `employee-photos` bucket must be `public = true`) and the employee actually has a photo uploaded. |
| 404 on direct navigation to `/e/:token` after deploying | Confirm `vercel.json` is present and deployed; it's required for SPA client-side routing. |
| Login fails with a generic error | Confirm the user exists in Supabase Auth and the email is confirmed. |

## Project structure

```
src/
  components/brand/       Logo (independent demo mark)
  components/public/      Public verification page building blocks
  config/siteLinks.ts     Centralized nav/footer link + identity config
  features/auth/          Login page
  features/employees/     Admin CRUD (list, new, edit, details, print)
  features/public/        Public /e/:token page + data fetching
  features/misc/          Generic not-found page
  lib/                    Supabase client, auth, token/URL/QR/mask/date utils
  routes/                 Route guards
  types/database.ts       Hand-written Supabase schema types
supabase/migrations/      Timestamped SQL migrations
scripts/                  Visual verification screenshot helper
```
