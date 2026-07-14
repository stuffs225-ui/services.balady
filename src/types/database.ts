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
  is_active: boolean
  created_at: string
  updated_at: string
}

export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'updated_at'>

export type EmployeeUpdate = Partial<
  Omit<Employee, 'id' | 'public_token' | 'created_at' | 'updated_at'>
>

export type CertificateStatus = 'active' | 'expired' | 'revoked'

export type PublicCertificate = {
  employee_name: string
  identity_number_masked: string
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
  status: CertificateStatus
}

export type NavLinkSetting = {
  label: string
  href: string
}

export type FooterBadgeSetting = {
  imagePath: string
  alt: string
  href: string | null
}

export type SiteSettings = {
  id: string
  logo_path: string | null
  nav_links: NavLinkSetting[]
  footer_links: NavLinkSetting[]
  footer_badges: FooterBadgeSetting[]
  footer_copyright_text: string
  footer_support_text: string
  trust_banner_text: string
  accessibility_link_href: string | null
  header_title_text: string
  header_subtitle_text: string
  updated_at: string
}

export type SiteSettingsUpdate = Partial<
  Pick<
    SiteSettings,
    | 'logo_path'
    | 'nav_links'
    | 'footer_links'
    | 'footer_badges'
    | 'footer_copyright_text'
    | 'footer_support_text'
    | 'trust_banner_text'
    | 'accessibility_link_href'
    | 'header_title_text'
    | 'header_subtitle_text'
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
