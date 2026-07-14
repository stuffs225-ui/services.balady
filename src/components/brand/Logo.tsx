type LogoProps = {
  className?: string
  variant?: 'default' | 'inverted'
}

/**
 * Independent demo mark: a rounded shield with a checkmark.
 * Intentionally generic — not a reproduction of any government seal.
 */
function Logo({ className, variant = 'default' }: LogoProps) {
  const fill = variant === 'inverted' ? '#ffffff' : '#1f885b'
  const mark = variant === 'inverted' ? '#1f885b' : '#ffffff'

  return (
    <svg
      viewBox="0 0 40 40"
      width="40"
      height="40"
      className={className}
      role="img"
      aria-label="شعار النظام التجريبي"
    >
      <path
        d="M20 4l12 4.5v7.6c0 8-5 13.9-12 16.4-7-2.5-12-8.4-12-16.4V8.5L20 4z"
        fill={fill}
      />
      <path
        d="M14.5 20l4 4 7-7.4"
        stroke={mark}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export default Logo
