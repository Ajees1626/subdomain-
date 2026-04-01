/** Inbox for Web3Forms + mailto (configure Web3Forms to deliver to this Gmail) */
export const CONTACT_EMAIL = 'pixdotsolutions@gmail.com'

/** Review-step hint: single inbox, no CC to client; WhatsApp on thank-you screen */
export const BOOKING_REVIEW_HINT =
  'Sends only to pixdotsolutions@gmail.com — no copy to your email. After sending, use WhatsApp on the next screen to share the same details with Pixdot.'

/**
 * Pixdot WhatsApp (digits only, country code, no +). Used for wa.me links.
 * Set VITE_PIXDOT_WHATSAPP in .env (e.g. 919876543210 for India).
 */
export const PIXDOT_WHATSAPP_DIGITS =
  (import.meta.env.VITE_PIXDOT_WHATSAPP && String(import.meta.env.VITE_PIXDOT_WHATSAPP).replace(/\D/g, '')) || ''

/** Default Web3Forms access key (override with VITE_WEB3FORMS_ACCESS_KEY in .env) */
export const WEB3FORMS_ACCESS_KEY_DEFAULT = '760a81bf-1082-4d0d-8964-b791d3b72282'
