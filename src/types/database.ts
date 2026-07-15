import type { EmployeePhotoCrop } from '../lib/photoCrop'

export type Employee = {
  id: string
  public_token: string
  employee_name: string
  identity_number: string
  gender: string
  nationality: string
  profession: string
  authority_name: string
  municipality_name: string
  certificate_number: string
  license_number: string | null
  establishment_name: string
  establishment_number: string | null
  program_type: string | null
  issue_date_hijri: string | null
  issue_date_gregorian: string
  expiry_date_hijri: string | null
  expiry_date_gregorian: string
  program_completion_date_hijri: string | null
  employee_photo_path: string | null
  employee_photo_crop: EmployeePhotoCrop | null
  employee_card_overrides: EmployeeCardOverrides | null
  is_active: boolean
  /**
   * Admin-only visit counter for the public certificate page, incremented
   * server-side by verify_certificate() on every lookup (QR scan or direct
   * link) — never set or read by the client, and never exposed through the
   * public RPC's own return type.
   */
  visit_count: number
  created_at: string
  updated_at: string
}

export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'visit_count'>

export type EmployeeUpdate = Partial<
  Omit<Employee, 'id' | 'public_token' | 'created_at' | 'updated_at' | 'visit_count'>
>

export type CertificateStatus = 'active' | 'expired' | 'revoked'

export type PublicCertificate = {
  employee_name: string
  identity_number: string
  gender: string
  nationality: string
  profession: string
  authority_name: string
  municipality_name: string
  certificate_number: string
  license_number: string | null
  establishment_name: string
  establishment_number: string | null
  program_type: string | null
  issue_date_hijri: string | null
  issue_date_gregorian: string
  expiry_date_hijri: string | null
  expiry_date_gregorian: string
  program_completion_date_hijri: string | null
  has_photo: boolean
  employee_photo_crop: EmployeePhotoCrop | null
  status: CertificateStatus
}

export type NavMenuLink = {
  label: string
  href: string
}

export type NavMenuSection = {
  title: string
  links: NavMenuLink[]
}

export type NavLinkSetting = {
  label: string
  href: string
  /**
   * When present (and non-empty), this nav item becomes a dropdown: tapping
   * it expands this list of titled sections instead of navigating to href.
   * href is then unused, kept only so the item can be converted back to a
   * plain link without losing what was typed there.
   */
  sections?: NavMenuSection[]
}

export type EmployeeCardBox = {
  x: number
  y: number
  width: number
  height: number
}

export type EmployeeCardTextBox = EmployeeCardBox & {
  fontSize: number
  color: string
  align: 'right' | 'left' | 'center'
}

export type EmployeeCardLayout = {
  fullName: EmployeeCardTextBox
  photo: EmployeeCardBox
  qr: EmployeeCardBox
  identityNumber: EmployeeCardTextBox
  nationality: EmployeeCardTextBox
  certificateNumber: EmployeeCardTextBox
  profession: EmployeeCardTextBox
  issueDate: EmployeeCardTextBox
  expiryDate: EmployeeCardTextBox
  educationProgramType: EmployeeCardTextBox
  educationProgramExpiry: EmployeeCardTextBox
}

export type EmployeeCardFieldOverride = {
  fontSize?: number
  text?: string
}

export type EmployeeCardOverrides = Partial<
  Record<Exclude<keyof EmployeeCardLayout, 'photo' | 'qr'>, EmployeeCardFieldOverride>
>

export type FooterBadgeSetting = {
  imagePath: string
  alt: string
  href: string | null
}

export type SiteSettings = {
  id: string
  logo_path: string | null
  logo_link_href: string | null
  nav_links: NavLinkSetting[]
  footer_links: NavLinkSetting[]
  footer_badges: FooterBadgeSetting[]
  footer_copyright_text: string
  footer_support_text: string
  trust_banner_text: string
  accessibility_link_href: string | null
  header_title_text: string
  header_subtitle_text: string
  logo_size: number
  footer_badge_size: number
  employee_card_template_path: string | null
  employee_card_back_template_path: string | null
  employee_card_layout: Partial<EmployeeCardLayout> | null
  updated_at: string
}

export type SiteSettingsUpdate = Partial<
  Pick<
    SiteSettings,
    | 'logo_path'
    | 'logo_link_href'
    | 'nav_links'
    | 'footer_links'
    | 'footer_badges'
    | 'footer_copyright_text'
    | 'footer_support_text'
    | 'trust_banner_text'
    | 'accessibility_link_href'
    | 'header_title_text'
    | 'header_subtitle_text'
    | 'logo_size'
    | 'footer_badge_size'
    | 'employee_card_template_path'
    | 'employee_card_back_template_path'
    | 'employee_card_layout'
  >
>

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: Employee
        Insert: EmployeeInsert
        Update: EmployeeUpdate
        Relationships: []
      }
      site_settings: {
        Row: SiteSettings
        Insert: never
        Update: SiteSettingsUpdate
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      verify_certificate: {
        Args: { p_token: string }
        Returns: PublicCertificate[]
      }
    }
  }
}
