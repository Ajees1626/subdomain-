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

/** File names in `public/images/` — spaces encoded for URLs */
const img = (file) => `/images/${encodeURIComponent(file)}`

/**
 * Collapsed accordion — photos from `public/images/`.
 */
export const SERVICE_COLLAPSED_IMAGES = {
  'brand-creative': img('brand and creative_result.webp'),
  packaging: img('packaging design_result.webp'),
  'digital-marketing': img('digital markeing_result.webp'),
  'personal-branding': img('personal braning_result.webp'),
  website: img('website development_result.webp'),
  app: img('app development_result.webp'),
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
