/** Digital Marketing — fixed plans, page handling, and custom line rates (₹). */


export const DM_PLAN_A = {
  id: 'plan-a',
  name: 'Plan A',
  price: 24999,
  withContent: true,
  lines: [
    { label: 'Creative', qty: 3 },
    { label: 'Ad creative', qty: 2 },
    { label: 'Animation reel', qty: 2 },
    { label: 'Shoot with edit reel', qty: 2 },
    { label: 'Voice over video', qty: 1 },
    { label: 'Meta ad', qty: 4 },
  ],
}

export const DM_PLAN_B = {
  id: 'plan-b',
  name: 'Plan B',
  price: 39999,
  withContent: true,
  lines: [
    { label: 'Creative', qty: 5 },
    { label: 'Ad creative', qty: 3 },
    { label: 'Animation reel', qty: 4 },
    { label: 'Shoot with edit reel', qty: 4 },
    { label: 'Voice over video', qty: 1 },
    { label: 'Meta ad', qty: 4 },
  ],
}

/** Client-provided creative & reels — page handling bundle */
export const DM_PAGE_HANDLING = {
  id: 'page-handling',
  name: 'Page handling',
  price: 10000,
  subtitle: 'Overall package',
  description: 'For clients who provide their own creative and reels — we handle pages, setup, and publishing workflow.',
}

/** Custom — per-unit pricing (with content / without content) */
export const DM_CUSTOM_KEYS = [
  {
    key: 'creative',
    label: 'Creative',
    withContent: 999,
    withoutContent: 699,
  },
  {
    key: 'adCreative',
    label: 'Ad creative',
    withContent: 1499,
    withoutContent: 999,
  },
  {
    key: 'animationReel',
    label: 'Animation reel',
    withContent: 1999,
    withoutContent: 1499,
  },
  {
    key: 'shootEdit',
    label: 'Shoot with edit',
    withContent: 2999,
    withoutContent: 2499,
  },
  {
    key: 'voiceOver',
    label: 'Voice over video',
    withContent: 2999,
    withoutContent: 2499,
  },
  {
    key: 'metaAd',
    label: 'Meta ad (per setup)',
    withContent: 2499,
    withoutContent: 2499,
  },
]

export function initialCustomQuantities() {
  return Object.fromEntries(DM_CUSTOM_KEYS.map((r) => [r.key, 0]))
}

export function computeCustomTotal(quantities, contentMode) {
  const useWith = contentMode === 'with'
  let total = 0
  const breakdown = []
  for (const row of DM_CUSTOM_KEYS) {
    const qty = Math.max(0, Number(quantities[row.key]) || 0)
    const unit = useWith ? row.withContent : row.withoutContent
    const line = qty * unit
    total += line
    if (qty > 0) {
      breakdown.push({
        label: row.label,
        qty,
        unit,
        line,
      })
    }
  }
  return { total, breakdown }
}
