/**
 * Client portal — branding, contacts, social (view-only for logged-in clients).
 * Keys must match DASHBOARD_CLIENTS / APRIL_2026_CLIENT_DEFS ids.
 */

/** @typedef {{ label: string, url: string, handle?: string }} SocialLink */

const DEFAULT_PORTAL = {
  logoUrl: null,
  companyTagline: null,
  ownerPhones: [],
  ownerEmails: [],
  /** @type {SocialLink[]} */
  socialLinks: [],
}

/** Which Pixdot services this client uses (ids from services.js) */
export const CLIENT_PORTAL_SERVICE_IDS = {
  'client-megna': ['digital-marketing', 'website'],
  'client-velan-veg': ['digital-marketing'],
  'client-velan-nonveg': ['digital-marketing'],
  'client-velan-sweets': ['digital-marketing'],
  'client-brand-box': ['digital-marketing', 'brand-creative'],
  'client-rj-steels': ['digital-marketing', 'website'],
  'client-greenline': ['digital-marketing'],
  'client-two-innings': ['digital-marketing'],
  'client-treasure-island': ['digital-marketing'],
  'client-fb-cake': ['digital-marketing', 'packaging'],
  'client-treasure-school': ['digital-marketing'],
  'client-little-buds': ['digital-marketing'],
  'client-jaz': ['digital-marketing', 'personal-branding'],
  'client-vedha-tv': ['digital-marketing'],
}

export const CLIENT_PORTAL_PROFILES = {
  'client-megna': {
    logoUrl: null,
    companyTagline: 'Creative & digital partner',
    ownerPhones: ['+91 98765 43210'],
    ownerEmails: ['hello@megna.in', 'projects@megna.in'],
    socialLinks: [
      { label: 'Instagram', url: 'https://www.instagram.com/', handle: '@megna' },
      { label: 'Facebook', url: 'https://www.facebook.com/' },
      { label: 'YouTube', url: 'https://www.youtube.com/' },
    ],
  },
  'client-vedha-tv': {
    logoUrl: null,
    companyTagline: null,
    ownerPhones: ['+91 90000 00000'],
    ownerEmails: ['contact@vedhatv.example'],
    socialLinks: [{ label: 'Instagram', url: 'https://www.instagram.com/' }],
  },
}

/** Only services listed here appear under “Your services” for that client — no default guess. */
export function getPortalServiceIds(clientId) {
  return CLIENT_PORTAL_SERVICE_IDS[clientId] ?? []
}

export function getPortalProfile(clientId) {
  const extra = CLIENT_PORTAL_PROFILES[clientId]
  if (!extra) {
    return { ...DEFAULT_PORTAL }
  }
  return {
    ...DEFAULT_PORTAL,
    ...extra,
    ownerPhones: [...(extra.ownerPhones ?? [])],
    ownerEmails: [...(extra.ownerEmails ?? [])],
    socialLinks: [...(extra.socialLinks ?? [])],
  }
}
