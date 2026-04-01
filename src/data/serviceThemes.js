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
