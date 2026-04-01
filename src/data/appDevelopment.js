/** App development — tiers (₹ ranges) + add-ons */

export const APP_TIERS = [
  {
    id: 'basic',
    name: 'Basic App',
    min: 29999,
    max: 49999,
    features: ['Simple UI', '3–5 Screens', 'Basic Features'],
  },
  {
    id: 'business',
    name: 'Business App',
    min: 59999,
    max: 99999,
    features: ['API Integration', 'Login/Register', 'Admin Dashboard', 'Database'],
  },
  {
    id: 'premium',
    name: 'Premium App',
    min: 120000,
    max: null,
    features: [
      'Full Custom App',
      'E-commerce / Booking System',
      'Payment Integration',
      'Push Notifications',
      'Advanced UI/UX',
    ],
  },
]

export const APP_ADDONS = [
  { id: 'playStore', label: 'Play Store Upload', price: 4999, unit: 'flat' },
  { id: 'maintenance', label: 'App Maintenance', price: 5000, unit: 'month' },
  { id: 'api', label: 'API Integration', price: 7999, unit: 'flat' },
]
