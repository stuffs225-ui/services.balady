import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MobileNavigation from './MobileNavigation'
import type { NavLinkSetting } from '../../types/database'

const NAV_LINKS: NavLinkSetting[] = [
  { label: 'عن النظام', href: '/about' },
  {
    label: 'الخدمات',
    href: '',
    sections: [
      {
        title: 'الصفحات الشخصية',
        links: [
          { label: 'إدارة الطلبات', href: '/requests' },
          { label: 'إدارة الرخص', href: '/licenses' },
        ],
      },
      {
        title: 'الرخص التجارية',
        links: [{ label: 'إصدار رخصة تجارية', href: '/licenses/new' }],
      },
    ],
  },
  { label: 'تواصل معنا', href: '/contact' },
]

describe('MobileNavigation dropdown sections', () => {
  it('renders a plain link for nav items without sections', () => {
    render(<MobileNavigation isOpen navLinks={NAV_LINKS} />)
    const link = screen.getByRole('link', { name: /عن النظام/ })
    expect(link).toHaveAttribute('href', '/about')
  })

  it('renders a nav item with sections as a toggle button, not a link', () => {
    render(<MobileNavigation isOpen navLinks={NAV_LINKS} />)
    expect(screen.queryByRole('link', { name: /الخدمات/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /الخدمات/ })).toBeInTheDocument()
  })

  it('shows the sections and sub-links only after the dropdown item is clicked', async () => {
    render(<MobileNavigation isOpen navLinks={NAV_LINKS} />)

    expect(screen.queryByText('الصفحات الشخصية')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /الخدمات/ }))

    expect(screen.getByText('الصفحات الشخصية')).toBeInTheDocument()
    expect(screen.getByText('الرخص التجارية')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'إدارة الطلبات' })).toHaveAttribute('href', '/requests')
    expect(screen.getByRole('link', { name: 'إصدار رخصة تجارية' })).toHaveAttribute(
      'href',
      '/licenses/new',
    )
  })

  it('collapses the dropdown again when its toggle is clicked a second time', async () => {
    render(<MobileNavigation isOpen navLinks={NAV_LINKS} />)

    const toggle = screen.getByRole('button', { name: /الخدمات/ })
    await userEvent.click(toggle)
    expect(screen.getByText('الصفحات الشخصية')).toBeInTheDocument()

    await userEvent.click(toggle)
    expect(screen.queryByText('الصفحات الشخصية')).not.toBeInTheDocument()
  })

  it('only one dropdown is expanded at a time', async () => {
    const linksWithTwoDropdowns: NavLinkSetting[] = [
      NAV_LINKS[1],
      {
        label: 'المساعدة والدعم',
        href: '',
        sections: [{ title: 'قسم الدعم', links: [{ label: 'اتصل بنا', href: '/contact-us' }] }],
      },
    ]
    render(<MobileNavigation isOpen navLinks={linksWithTwoDropdowns} />)

    await userEvent.click(screen.getByRole('button', { name: /الخدمات/ }))
    expect(screen.getByText('الصفحات الشخصية')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /المساعدة والدعم/ }))
    expect(screen.queryByText('الصفحات الشخصية')).not.toBeInTheDocument()
    expect(screen.getByText('قسم الدعم')).toBeInTheDocument()
  })

  it('does not render an empty dropdown panel for an item with no sections yet', () => {
    render(
      <MobileNavigation isOpen navLinks={[{ label: 'الخدمات', href: '', sections: [] }]} />,
    )
    // No sections means it isn't treated as a dropdown at all — falls back
    // to a plain (if href-less) link, never an expandable button with
    // nothing inside it.
    expect(screen.queryByRole('button', { name: /الخدمات/ })).not.toBeInTheDocument()
  })

  it('renders a section with no title as a flat list, with no empty heading', async () => {
    render(
      <MobileNavigation
        isOpen
        navLinks={[
          {
            label: 'المساعدة والدعم',
            href: '',
            sections: [
              {
                title: '',
                links: [{ label: 'اتصل بنا', href: '/contact-us' }],
              },
            ],
          },
        ]}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /المساعدة والدعم/ }))

    expect(screen.getByRole('link', { name: 'اتصل بنا' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('marks an absolute (external) sub-link with an external-link icon, but not a relative one', async () => {
    render(
      <MobileNavigation
        isOpen
        navLinks={[
          {
            label: 'المساعدة والدعم',
            href: '',
            sections: [
              {
                title: '',
                links: [
                  { label: 'الإبلاغ عن شبهة فساد', href: 'https://example.com/report' },
                  { label: 'اتصل بنا', href: '/contact-us' },
                ],
              },
            ],
          },
        ]}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /المساعدة والدعم/ }))

    const externalLink = screen.getByRole('link', { name: /الإبلاغ عن شبهة فساد/ })
    expect(externalLink.querySelector('svg')).toBeInTheDocument()

    const internalLink = screen.getByRole('link', { name: 'اتصل بنا' })
    expect(internalLink.querySelector('svg')).not.toBeInTheDocument()
  })
})

describe('MobileNavigation primary action button', () => {
  it('uses the admin-configured label/href when provided', () => {
    render(
      <MobileNavigation
        isOpen
        navLinks={NAV_LINKS}
        primaryActionLabel="الدخول لحسابي"
        primaryActionHref="https://example.test/account"
      />,
    )

    const button = screen.getByRole('link', { name: 'الدخول لحسابي' })
    expect(button).toHaveAttribute('href', 'https://example.test/account')
  })

  it('falls back to the static default label/href when none is provided', () => {
    render(<MobileNavigation isOpen navLinks={NAV_LINKS} />)
    expect(screen.getByRole('link', { name: 'بوابة الأعمال التجريبية' })).toHaveAttribute(
      'href',
      '/business-portal',
    )
  })
})
