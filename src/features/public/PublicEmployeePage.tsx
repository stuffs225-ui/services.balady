import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PublicTrustBanner from '../../components/public/PublicTrustBanner'
import AccessibilityToolbar from '../../components/public/AccessibilityToolbar'
import PublicHeader from '../../components/public/PublicHeader'
import PublicPageTitle from '../../components/public/PublicPageTitle'
import EmployeePortrait from '../../components/public/EmployeePortrait'
import CertificateFieldList from '../../components/public/CertificateFieldList'
import PublicFooter from '../../components/public/PublicFooter'
import VerificationLoadingState from '../../components/public/VerificationLoadingState'
import VerificationNotFoundState from '../../components/public/VerificationNotFoundState'
import VerificationNetworkErrorState from '../../components/public/VerificationNetworkErrorState'
import { fetchPublicCertificate, type PublicCertificateResult } from './api'
import type { DatePreference } from '../../config/publicNavigation'
import { useSiteSettings } from '../settings/useSiteSettings'

function PublicEmployeePage() {
  const { token } = useParams<{ token: string }>()
  const [result, setResult] = useState<PublicCertificateResult | 'loading'>('loading')
  const [datePreference, setDatePreference] = useState<DatePreference | null>(null)
  const [isLargeText, setIsLargeText] = useState(false)
  const { accessibilityLinkHref, logoLinkHref, isLoading: settingsLoading } = useSiteSettings()

  const isRevoked = result !== 'loading' && result.kind === 'found' && result.certificate.status === 'revoked'
  // A deactivated employee's certificate is never shown to the public —
  // instead the visitor is bounced to the organization's own site (the
  // same URL configured for the header logo link). Waiting on
  // settingsLoading avoids a flash of the certificate before that URL is
  // known; if none is configured at all, there's nowhere to send the
  // visitor, so the certificate page's own "revoked" status is shown
  // as a fallback instead.
  const isRedirectingToOrgSite = isRevoked && (settingsLoading || Boolean(logoLinkHref))

  useEffect(() => {
    if (isRevoked && !settingsLoading && logoLinkHref) {
      window.location.replace(logoLinkHref)
    }
  }, [isRevoked, settingsLoading, logoLinkHref])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!token) {
        if (!cancelled) setResult({ kind: 'not-found' })
        return
      }

      setResult('loading')
      const res = await fetchPublicCertificate(token)
      if (!cancelled) setResult(res)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="public-verification flex min-h-svh flex-col bg-page-bg">
      <PublicTrustBanner />
      <AccessibilityToolbar
        datePreference={datePreference}
        onDatePreferenceChange={setDatePreference}
        isLargeText={isLargeText}
        onToggleLargeText={() => setIsLargeText((prev) => !prev)}
        accessibilityLinkHref={accessibilityLinkHref}
      />
      <PublicHeader />

      <main className="public-main">
        <div className="public-content mx-auto w-full max-w-[820px]">
          {result === 'loading' && (
            <>
              <PublicPageTitle />
              <VerificationLoadingState />
            </>
          )}

          {result !== 'loading' && result.kind === 'not-found' && <VerificationNotFoundState />}

          {result !== 'loading' && result.kind === 'network-error' && (
            <VerificationNetworkErrorState />
          )}

          {result !== 'loading' && result.kind === 'found' && isRedirectingToOrgSite && (
            <>
              <PublicPageTitle />
              <VerificationLoadingState />
            </>
          )}

          {result !== 'loading' && result.kind === 'found' && !isRedirectingToOrgSite && (
            <>
              <PublicPageTitle />
              <EmployeePortrait
                photoUrl={result.photoUrl}
                employeeName={result.certificate.employee_name}
                photoCrop={result.certificate.employee_photo_crop}
              />
              <CertificateFieldList
                certificate={result.certificate}
                datePreference={datePreference}
                largeText={isLargeText}
              />
            </>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}

export default PublicEmployeePage
