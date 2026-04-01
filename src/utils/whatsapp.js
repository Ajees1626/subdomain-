import { PIXDOT_WHATSAPP_DIGITS } from '../data/contact.js'

export function digitsOnly(phone) {
  return String(phone || '').replace(/\D/g, '')
}

/** https://wa.me/<digits>?text=... */
export function waMeUrl(phoneDigits, text) {
  const d = digitsOnly(phoneDigits)
  if (!d || d.length < 10) return null
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`
}

/**
 * Client → Pixdot: pre-filled message with booking summary snippet.
 */
export function whatsappToPixdotUrl(serviceName, plainBodySnippet) {
  if (!PIXDOT_WHATSAPP_DIGITS) return null
  const max = 4000
  const body =
    plainBodySnippet.length > max
      ? plainBodySnippet.slice(0, max) + '\n… (trimmed; full text is in the email to Pixdot)'
      : plainBodySnippet
  const msg = [`Hi Pixdot — ${serviceName} booking`, '', body].join('\n')
  return waMeUrl(PIXDOT_WHATSAPP_DIGITS, msg)
}

