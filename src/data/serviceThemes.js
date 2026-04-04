/**
 * Expanded-panel gradients + index tint per service (aligned with palette.js).
 */
import { GRADIENTS } from './palette.js'

export const SERVICE_THEMES = {
  'brand-creative': {
    gradient: GRADIENTS.purple,
    indexColor: '#A98BEF',
  },
  packaging: {
    gradient: GRADIENTS.peach,
    indexColor: '#F6B38E',
  },
  'digital-marketing': {
    gradient: GRADIENTS.blue,
    indexColor: '#9FBDE3',
  },
  'personal-branding': {
    gradient: GRADIENTS.pink,
    indexColor: '#EFA6B2',
  },
  website: {
    gradient: GRADIENTS.green,
    indexColor: '#A8D8C3',
  },
  app: {
    gradient: GRADIENTS.violet,
    indexColor: '#BFA2F2',
  },
}

/**
 * Large background word behind the icon (expanded panel).
 * Order on the landing page: Logo → Packaging → Ads → YouTube → Website → App.
 */
export const SERVICE_WATERMARKS = {
  'brand-creative': 'LOGO',
  packaging: 'PACKAGING',
  'digital-marketing': 'ADS',
  'personal-branding': 'YOU',
  website: 'WEBSITE',
  app: 'APP',
}

/**
 * Collapsed accordion — hero photos (Cloudinary).
 */
export const SERVICE_COLLAPSED_IMAGES = {
  'brand-creative':
    'https://res.cloudinary.com/dxiwvcfs5/image/upload/v1775292062/brand_and_creative_result_g6pwwz.webp',
  packaging:
    'https://res.cloudinary.com/dxiwvcfs5/image/upload/v1775292063/packaging_design_result_lnnx0d.webp',
  'digital-marketing':
    'https://res.cloudinary.com/dxiwvcfs5/image/upload/v1775292062/digital_markeing_result_rlrdqi.webp',
  'personal-branding':
    'https://res.cloudinary.com/dxiwvcfs5/image/upload/v1775292062/personal_braning_result_t4az7v.webp',
  website:
    'https://res.cloudinary.com/dxiwvcfs5/image/upload/v1775292062/website_development_result_wwqv41.webp',
  app: 'https://res.cloudinary.com/dxiwvcfs5/image/upload/v1775292061/app_development_result_rsvczq.webp',
}

/** Spread onto `dm-panel` roots so inner cards pick up themed gradients via CSS */
export function servicePanelProps(serviceId) {
  const t = SERVICE_THEMES[serviceId]
  if (!t) return {}
  return {
    'data-service': serviceId,
    style: {
      '--svc-gradient': t.gradient,
      '--svc-index': t.indexColor,
    },
  }
}
