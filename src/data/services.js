/**
 * Pixdot — 6 services. Each maps to a full panel in App.jsx.
 * Order matches the landing accordion: Brand → Packaging → Ads → YouTube → Website → App.
 */
export const SERVICES = [
  {
    id: 'brand-creative',
    name: 'Brand & Creative',
    tagline: 'Logo, print & brand assets',
    options: [{ id: 'quote', label: 'Quote & booking' }],
  },
  {
    id: 'packaging',
    name: 'Packaging Design',
    tagline: 'Master, mono & family packs',
    options: [{ id: 'quote', label: 'Packages & booking' }],
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    tagline: 'Ads, plans, page handling & custom',
    options: [{ id: 'plans', label: 'Plans & booking' }],
  },
  {
    id: 'personal-branding',
    name: 'Personal Branding',
    tagline: 'YouTube, reels & posters',
    options: [{ id: 'plans', label: 'Plans & booking' }],
  },
  {
    id: 'website',
    name: 'Website Development',
    tagline: 'Basic to premium sites',
    options: [{ id: 'tiers', label: 'Tiers & add-ons' }],
  },
  {
    id: 'app',
    name: 'App Development',
    tagline: 'Basic to premium apps',
    options: [{ id: 'tiers', label: 'Tiers & add-ons' }],
  },
]

/** Fallback if a service has no panel */
export function getDetailPlaceholder(service, option) {
  return {
    title: `${service.name} — ${option.label}`,
    lines: ['This service panel is loading or not configured.'],
  }
}
