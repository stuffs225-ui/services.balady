# Employee Field Mapping

The 17 fields below were already implemented (public page + admin form +
database schema + RPC) prior to this task, from the same field list supplied
in `employee-fields.sanitized.json`. **No schema gap was found — no
migration was necessary.**

| # | Arabic label (public page) | DB column | RPC field | Type | Sensitive |
|---|---|---|---|---|---|
| 1 | الأمانة | `authority_name` | `authority_name` | text | no |
| 2 | البلدية | `municipality_name` | `municipality_name` | text | no |
| 3 | الاسم | `employee_name` | `employee_name` | text | yes |
| 4 | رقم الهوية | `identity_number` | `identity_number_masked` (masked) | text | yes — masked server-side |
| 5 | الجنس | `gender` | `gender` | text | no |
| 6 | الجنسية | `nationality` | `nationality` | text | no |
| 7 | رقم الشهادة الصحية | `certificate_number` | `certificate_number` | text (unique) | no |
| 8 | المهنة | `profession` | `profession` | text | no |
| 9 | تاريخ إصدار الشهادة الصحية هجري | `issue_date_hijri` | `issue_date_hijri` | text (nullable) | no |
| 10 | تاريخ إصدار الشهادة الصحية ميلادي | `issue_date_gregorian` | `issue_date_gregorian` | date | no |
| 11 | تاريخ نهاية الشهادة الصحية هجري | `expiry_date_hijri` | `expiry_date_hijri` | text (nullable) | no |
| 12 | تاريخ نهاية الشهادة الصحية ميلادي | `expiry_date_gregorian` | `expiry_date_gregorian` | date | no |
| 13 | نوع البرنامج التثقيفى | `program_type` | `program_type` | text (nullable) | no |
| 14 | تاريخ انتهاء البرنامج التثقيفي | `program_completion_date_hijri` | `program_completion_date_hijri` | text (nullable) | no |
| 15 | رقم الرخصة | `license_number` | `license_number` | text (nullable) | no |
| 16 | اسم المنشأة | `establishment_name` | `establishment_name` | text | no |
| 17 | رقم المنشأة | `establishment_number` | `establishment_number` | text (nullable) | no |

Additional non-visible/computed data used by the page:
- `employee_photo_path` → never returned by the RPC; the public page derives
  the storage path itself from the token already in the URL (`{token}/photo`)
  and requests a signed URL. The RPC only returns `has_photo: boolean`.
- `is_active` + `expiry_date_gregorian` → computed into `status`
  (`active` / `expiring` / `expired` / `revoked`) inside the RPC, never a
  raw stored column exposed directly.
- `id` (internal UUID) and `employee_photo_path` (raw storage path) are
  never returned by `verify_certificate()` — confirmed in
  `supabase/migrations/20260714173923_public_verify_rpc.sql`.

No fields were invented; every row above maps to a field actually present
in `employee-fields.sanitized.json` and the exact order given in the task.
