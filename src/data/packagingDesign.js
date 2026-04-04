/** Packaging design — packages + packaging-only custom add-ons (₹) */

export const PKG_MASTER = {
  id: 'master',
  name: 'Master design',
  blurb: 'Flagship packaging — full creative depth, 3 base options per bundle.',
  tierA: 6999,
  tierB: 9999,
  includedDesignOptions: 3,
  extraOptionPrice: 2999,
}

export const PKG_MONO = {
  id: 'mono',
  name: 'Mono design',
  blurb: 'Streamlined single-line look — fast, consistent shelf presence.',
  tierA: 3999,
  tierB: 7999,
  includedDesignOptions: 3,
  extraOptionPrice: 2999,
}

export const PKG_FAMILY = {
  id: 'family',
  name: 'Family design',
  blurb: 'Related packs in one system — variants that stay on brand together.',
  tierA: 3999,
  tierB: 6999,
  includedDesignOptions: 3,
  extraOptionPrice: 2999,
}

export const PACKAGING_PACKAGES = [PKG_MASTER, PKG_MONO, PKG_FAMILY]

/** Optional packaging-only line items (not Digital Marketing) */
export const PACKAGING_CUSTOM_KEYS = [
  { key: 'structuralMockup', label: 'Structural / 3D mockup round', price: 3500 },
  { key: 'printProof', label: 'Extra print-proof round', price: 2500 },
  { key: 'dielineExport', label: 'Dieline / die-line export', price: 4500 },
  { key: 'materialSample', label: 'Material / substrate sample', price: 5500 },
  { key: 'rushTimeline', label: 'Rush timeline add-on', price: 5999 },
]

export function initialPackagingCustomQuantities() {
  return Object.fromEntries(PACKAGING_CUSTOM_KEYS.map((r) => [r.key, 0]))
}

/**
 * @returns {{ total: number, breakdown: { label: string, qty: number, unit: number, line: number }[] }}
 */
export function computePackagingCustomTotal(quantities) {
  const breakdown = []
  let total = 0
  for (const row of PACKAGING_CUSTOM_KEYS) {
    const qty = Math.max(0, Number(quantities[row.key]) || 0)
    if (qty <= 0) continue
    const line = qty * row.price
    total += line
    breakdown.push({ label: row.label, qty, unit: row.price, line })
  }
  return { total, breakdown }
}

/** @deprecated Old proration (bundle ÷ 3); dual pricing uses full bundle × count */
export function packagingPerDesignRateA(pkg) {
  return Math.round(pkg.tierA / pkg.includedDesignOptions)
}

export function packagingPerDesignRateB(pkg) {
  return Math.round(pkg.tierB / pkg.includedDesignOptions)
}

function normalizePackTierFlags(ps) {
  if (!ps) return { includeA: false, includeB: false }
  let includeA = ps.includeA
  let includeB = ps.includeB
  const rawA = Math.max(0, Number(ps.countA) || 0)
  const rawB = Math.max(0, Number(ps.countB) || 0)
  const rawXA = Math.max(0, Number(ps.extraOptionsA) || 0)
  const rawXB = Math.max(0, Number(ps.extraOptionsB) || 0)
  const legacy = Math.max(0, Number(ps.extraOptions) || 0)
  if (includeA === undefined) includeA = rawA > 0 || rawXA > 0 || legacy > 0
  else includeA = Boolean(includeA)
  if (includeB === undefined) includeB = rawB > 0 || rawXB > 0
  else includeB = Boolean(includeB)
  return { includeA, includeB }
}

/**
 * Per tier: include flag, then count × bundle tier price; extras @ extraOptionPrice.
 * @param {{ countA: number, countB: number, includeA?: boolean, includeB?: boolean, extraOptionsA: number, extraOptionsB: number }} ps
 */
export function computePackagingPriceDual(pkg, ps) {
  if (!pkg) {
    return {
      total: 0,
      countA: 0,
      countB: 0,
      unitA: 0,
      unitB: 0,
      lineA: 0,
      lineB: 0,
      extraOptionsA: 0,
      extraOptionsB: 0,
      extraLineA: 0,
      extraLineB: 0,
      extraLine: 0,
      extraOptionPrice: 0,
      includeA: false,
      includeB: false,
    }
  }
  const { includeA, includeB } = normalizePackTierFlags(ps)
  let countA = Math.max(0, Number(ps?.countA) || 0)
  let countB = Math.max(0, Number(ps?.countB) || 0)
  let extraOptionsA = Math.max(0, Number(ps?.extraOptionsA) || 0)
  let extraOptionsB = Math.max(0, Number(ps?.extraOptionsB) || 0)
  const legacyExtra = Math.max(0, Number(ps?.extraOptions) || 0)
  if (legacyExtra > 0 && extraOptionsA === 0 && extraOptionsB === 0) {
    extraOptionsA = legacyExtra
  }
  if (!includeA) {
    countA = 0
    extraOptionsA = 0
  }
  if (!includeB) {
    countB = 0
    extraOptionsB = 0
  }
  const unitA = pkg.tierA
  const unitB = pkg.tierB
  const lineA = countA * unitA
  const lineB = countB * unitB
  const extraLineA = extraOptionsA * pkg.extraOptionPrice
  const extraLineB = extraOptionsB * pkg.extraOptionPrice
  const extraLine = extraLineA + extraLineB
  return {
    total: lineA + lineB + extraLine,
    countA,
    countB,
    unitA,
    unitB,
    lineA,
    lineB,
    extraOptionsA,
    extraOptionsB,
    extraLineA,
    extraLineB,
    extraLine,
    extraOptionPrice: pkg.extraOptionPrice,
    includeA,
    includeB,
  }
}

/** @deprecated use computePackagingPriceDual — kept for reference */
export function computePackagingPrice(pkg, tier, extraOptions) {
  if (!pkg) return { total: 0, base: 0, extraLine: 0, extraCount: 0 }
  const base = tier === 'a' ? pkg.tierA : pkg.tierB
  const x = Math.max(0, Number(extraOptions) || 0)
  const extraLine = x * pkg.extraOptionPrice
  return { total: base + extraLine, base, extraLine, extraCount: x, pkg }
}

export function initialPackState() {
  return Object.fromEntries(
    PACKAGING_PACKAGES.map((p) => [
      p.id,
      { countA: 0, countB: 0, extraOptionsA: 0, extraOptionsB: 0, includeA: false, includeB: false },
    ]),
  )
}

/** Package subtotal + packaging-only custom line items */
export function computePackagingWithCustom(pkg, tier, extraOptions, customQty) {
  const packaging = computePackagingPrice(pkg, tier, extraOptions)
  const custom = computePackagingCustomTotal(customQty)
  return {
    packaging,
    custom,
    total: packaging.total + custom.total,
  }
}

/**
 * Any combination of packages (Master / Mono / Family), each with A-count, B-count, and extra rounds.
 * @param {Record<string, { countA: number, countB: number, extraOptionsA: number, extraOptionsB: number, includeA?: boolean, includeB?: boolean }>} packStateById
 * @param {string[]} selectedIds — package ids in display order (e.g. master, mono, family)
 * @param {Record<string, number>} customQty
 */
export function computeMultiPackagingWithCustom(packStateById, selectedIds, customQty) {
  const packagingLines = []
  let packagingSubtotal = 0
  for (const id of selectedIds) {
    const pkg = PACKAGING_PACKAGES.find((p) => p.id === id)
    if (!pkg) continue
    const ps = packStateById[id] ?? {
      countA: 0,
      countB: 0,
      extraOptionsA: 0,
      extraOptionsB: 0,
      includeA: false,
      includeB: false,
    }
    const line = computePackagingPriceDual(pkg, ps)
    packagingSubtotal += line.total
    packagingLines.push({
      id,
      name: pkg.name,
      countA: line.countA,
      countB: line.countB,
      unitA: line.unitA,
      unitB: line.unitB,
      lineA: line.lineA,
      lineB: line.lineB,
      extraOptionsA: line.extraOptionsA,
      extraOptionsB: line.extraOptionsB,
      extraOptionPrice: line.extraOptionPrice,
      extraLineA: line.extraLineA,
      extraLineB: line.extraLineB,
      extraLine: line.extraLine,
      total: line.total,
      includeA: line.includeA,
      includeB: line.includeB,
    })
  }
  const custom = computePackagingCustomTotal(customQty)
  return {
    packagingLines,
    packagingSubtotal,
    custom,
    total: packagingSubtotal + custom.total,
  }
}
