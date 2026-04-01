import { CONTACT_EMAIL, WEB3FORMS_ACCESS_KEY_DEFAULT } from '../data/contact.js'
import { whatsappToPixdotUrl } from './whatsapp.js'

/**
 * Web3Forms → Pixdot inbox only (no CC to client, no reply-to client).
 * Client email / phone stay inside `message` (plainBody). WhatsApp link targets Pixdot with the same summary.
 * Fallback: mailto to Pixdot only.
 */
export async function submitBookingRequest({
  subject,
  plainBody,
  replyName,
  serviceName = 'Booking',
}) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY_DEFAULT
  const to = CONTACT_EMAIL

  const waPixdot = whatsappToPixdotUrl(serviceName, plainBody)

  let bodyWithLinks = plainBody
  if (waPixdot) {
    bodyWithLinks += `\n\n— Open WhatsApp to Pixdot (same details pre-filled) —\n${waPixdot}`
  }

  if (accessKey && String(accessKey).length > 8) {
    try {
      const payload = {
        access_key: accessKey,
        subject: subject || 'Pixdot booking request',
        from_name: replyName || 'Booking',
        name: replyName || 'Booking',
        /** Sender field for Web3Forms — Pixdot only; client email is already in `message` (plainBody) */
        email: to,
        message: bodyWithLinks,
      }

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        return {
          mode: 'web3',
          success: true,
          whatsappToPixdot: waPixdot,
        }
      }
      return { mode: 'web3', success: false, error: data.message || 'Could not send. Try again.' }
    } catch (e) {
      return { mode: 'web3', success: false, error: e?.message || 'Network error' }
    }
  }

  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject || 'Booking')}&body=${encodeURIComponent(bodyWithLinks || '')}`
  return {
    mode: 'mailto',
    mailtoUrl,
    success: true,
    whatsappToPixdot: waPixdot,
  }
}
