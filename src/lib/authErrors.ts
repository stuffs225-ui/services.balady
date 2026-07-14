/** Maps common Supabase Auth error messages to Arabic user-facing text. */
export function toArabicAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
  }
  if (normalized.includes('email not confirmed')) {
    return 'لم يتم تأكيد البريد الإلكتروني بعد'
  }
  if (normalized.includes('network')) {
    return 'تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى'
  }
  if (normalized.includes('too many requests') || normalized.includes('rate limit')) {
    return 'محاولات كثيرة جدًا، يرجى الانتظار قليلاً ثم إعادة المحاولة'
  }

  return 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى'
}
