const TOKEN_BYTE_LENGTH = 16 // 128 bits of entropy

/**
 * Generates a cryptographically secure, URL-safe, non-sequential token.
 * Uses the Web Crypto API (available in browsers and Vercel's Node runtime).
 */
export function generatePublicToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTE_LENGTH)
  crypto.getRandomValues(bytes)

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
