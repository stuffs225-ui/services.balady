import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-surface-muted px-6 text-center">
      <p className="text-2xl font-bold text-heading">الصفحة غير موجودة</p>
      <p className="text-text-secondary">تعذر العثور على الصفحة المطلوبة.</p>
      <Link to="/" className="mt-2 font-bold text-brand-primary underline underline-offset-4">
        العودة للصفحة الرئيسية
      </Link>
    </main>
  )
}

export default NotFoundPage
