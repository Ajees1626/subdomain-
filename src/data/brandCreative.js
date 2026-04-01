/** Brand & Creative — line items (₹) */

export const BC_LOGO = {
  id: 'logo',
  label: 'Logo',
  tierA: 9999,
  tierB: 24999,
  optionalAdd: 1999,
}

export const BC_GUIDELINE = { id: 'guideline', label: 'Brand guideline', tierA: 4999, tierB: 7999 }

export const BC_BUSINESS_CARD = { id: 'businessCard', label: 'Business card', tierA: 999, tierB: 1499 }

/** per page: low tier / high tier; content add ₹ per page when enabled */
export const BC_BROCHURE = {
  id: 'brochure',
  label: 'Brochure',
  perPageLow: 1499,
  perPageHigh: 2499,
  contentAddPerPage: 500,
}

export const BC_MENU = {
  id: 'menu',
  label: 'Menu card',
  perPageLow: 1999,
  perPageHigh: 3999,
}

export const BC_TSHIRT = { id: 'tshirt', label: 'T-shirt / bag design', tierA: 999, tierB: 1499 }

export const BC_LETTER = { id: 'letter', label: 'Letter head', tierA: 999, tierB: 1499 }

export const BC_PROMO_BANNER = {
  id: 'promoBanner',
  label: 'Promotional banner',
  tierA: 1499,
  tierB: 2499,
  contentAdd: 500,
}

export const BC_WEB_BANNER = { id: 'webBanner', label: 'Website banner', tierA: 1499, tierB: 2499 }

export function initialBrandState() {
  return {
    logo: { tier: 'none', optional: false },
    guideline: { tier: 'none' },
    businessCard: { tier: 'none' },
    brochure: { pages: 0, tier: 'low', contentAdd: false },
    menu: { pages: 0, tier: 'low' },
    tshirt: { tier: 'none' },
    letter: { tier: 'none' },
    promoBanner: { tier: 'none', contentAdd: false },
    webBanner: { tier: 'none' },
  }
}

/**
 * @returns {{ total: number, breakdown: { label: string, detail: string, line: number }[] }}
 */
export function computeBrandTotal(s) {
  const breakdown = []
  let total = 0

  function add(label, detail, line) {
    if (line <= 0) return
    total += line
    breakdown.push({ label, detail, line })
  }

  if (s.logo.tier === 'a') add(BC_LOGO.label, 'Standard tier', BC_LOGO.tierA)
  if (s.logo.tier === 'b') add(BC_LOGO.label, 'Premium tier', BC_LOGO.tierB)
  if (s.logo.optional && (s.logo.tier === 'a' || s.logo.tier === 'b')) {
    add(BC_LOGO.label, 'Optional add-on', BC_LOGO.optionalAdd)
  }

  if (s.guideline.tier === 'a') add(BC_GUIDELINE.label, 'Tier 1', BC_GUIDELINE.tierA)
  if (s.guideline.tier === 'b') add(BC_GUIDELINE.label, 'Tier 2', BC_GUIDELINE.tierB)

  if (s.businessCard.tier === 'a') add(BC_BUSINESS_CARD.label, 'Tier 1', BC_BUSINESS_CARD.tierA)
  if (s.businessCard.tier === 'b') add(BC_BUSINESS_CARD.label, 'Tier 2', BC_BUSINESS_CARD.tierB)

  const bp = Math.max(0, Number(s.brochure.pages) || 0)
  if (bp > 0) {
    const pp = s.brochure.tier === 'low' ? BC_BROCHURE.perPageLow : BC_BROCHURE.perPageHigh
    let line = bp * pp
    let detail = `${bp} p × ${pp} / page`
    if (s.brochure.contentAdd) {
      line += bp * BC_BROCHURE.contentAddPerPage
      detail += ` + content ${BC_BROCHURE.contentAddPerPage}/page`
    }
    add(BC_BROCHURE.label, detail, line)
  }

  const mp = Math.max(0, Number(s.menu.pages) || 0)
  if (mp > 0) {
    const pp = s.menu.tier === 'low' ? BC_MENU.perPageLow : BC_MENU.perPageHigh
    add(BC_MENU.label, `${mp} p × ${pp} / page`, mp * pp)
  }

  if (s.tshirt.tier === 'a') add(BC_TSHIRT.label, 'Tier 1', BC_TSHIRT.tierA)
  if (s.tshirt.tier === 'b') add(BC_TSHIRT.label, 'Tier 2', BC_TSHIRT.tierB)

  if (s.letter.tier === 'a') add(BC_LETTER.label, 'Tier 1', BC_LETTER.tierA)
  if (s.letter.tier === 'b') add(BC_LETTER.label, 'Tier 2', BC_LETTER.tierB)

  if (s.promoBanner.tier === 'a') {
    let line = BC_PROMO_BANNER.tierA
    let detail = 'Tier 1'
    if (s.promoBanner.contentAdd) {
      line += BC_PROMO_BANNER.contentAdd
      detail += ` + content ${BC_PROMO_BANNER.contentAdd}`
    }
    add(BC_PROMO_BANNER.label, detail, line)
  }
  if (s.promoBanner.tier === 'b') {
    let line = BC_PROMO_BANNER.tierB
    let detail = 'Tier 2'
    if (s.promoBanner.contentAdd) {
      line += BC_PROMO_BANNER.contentAdd
      detail += ` + content ${BC_PROMO_BANNER.contentAdd}`
    }
    add(BC_PROMO_BANNER.label, detail, line)
  }

  if (s.webBanner.tier === 'a') add(BC_WEB_BANNER.label, 'Tier 1', BC_WEB_BANNER.tierA)
  if (s.webBanner.tier === 'b') add(BC_WEB_BANNER.label, 'Tier 2', BC_WEB_BANNER.tierB)

  return { total, breakdown }
}
