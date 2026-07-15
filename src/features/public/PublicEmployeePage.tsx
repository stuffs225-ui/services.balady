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
  const { accessibilityLinkHref } = useSiteSettings()

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

          {result !== 'loading' && result.kind === 'found' && (
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
