import { siteIdentity } from '../../config/siteLinks'

function PublicPageTitle() {
  return (
    <h1 className="mx-auto mt-8 w-[85%] text-center text-[31px] leading-[1.15] font-extrabold text-heading sm:mt-9 sm:w-4/5 sm:text-4xl">
      شهادة صحية للأنشطة التجارية
      <br />
      <span className="text-lg font-bold text-brand-primary sm:text-xl">
        – {siteIdentity.demoLabel}
      </span>
    </h1>
  )
}

export default PublicPageTitle
