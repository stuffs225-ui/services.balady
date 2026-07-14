import { useSiteSettings } from '../../features/settings/useSiteSettings'

function PublicTrustBanner() {
  const { trustBannerText } = useSiteSettings()

  return (
    <section className="min-h-[108px] border-b border-divider bg-surface-muted px-[20px] pt-[14px] pb-[12px] text-center print:hidden">
      <p className="mx-auto m-0 w-[88%] text-[13px] leading-[1.5] font-medium text-public-body">
        {trustBannerText}
      </p>
    </section>
  )
}

export default PublicTrustBanner
