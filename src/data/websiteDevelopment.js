/** Website development — tiers (₹ ranges) + add-ons */

export const WEB_TIERS = [
  {
    id: 'basic',
    name: 'Basic Website',
    min: 9999,
    max: 19999,
    features: ['3–5 Pages', 'Responsive Design', 'Contact Form', 'Basic SEO'],
  },
  {
    id: 'business',
    name: 'Business Website',
    min: 24999,
    max: 49999,
    features: ['5–10 Pages', 'Custom UI Design', 'Admin Panel (Basic)', 'SEO Optimized', 'WhatsApp Integration'],
  },
  {
    id: 'premium',
    name: 'Premium Website',
    min: 59999,
    max: null,
    features: [
      'Fully Custom Design',
      'Advanced Animations (GSAP)',
      'Backend Integration',
      'Database (MySQL)',
      'Login System',
      'High Performance + SEO',
    ],
  },
]

export const WEB_ADDONS = [
  { id: 'extraPage', label: 'Extra Page', price: 1999, unit: 'page' },
  { id: 'payment', label: 'Payment Gateway', price: 4999, unit: 'flat' },
  { id: 'admin', label: 'Admin Panel', price: 7999, unit: 'flat' },
  { id: 'hosting', label: 'Hosting Setup', price: 2999, unit: 'flat' },
]
