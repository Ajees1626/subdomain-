/** Packaging design — packages + packaging-only custom add-ons (₹) */

export const PKG_MASTER = {
  id: 'master',
  name: 'Master design',
  tierA: 6999,
  tierB: 9999,
  includedDesignOptions: 3,
  extraOptionPrice: 2999,
}

export const PKG_MONO = {
  id: 'mono',
  name: 'Mono design',
  tierA: 3999,
  tierB: 7999,
  includedDesignOptions: 3,
  extraOptionPrice: 2999,
}

export const PKG_FAMILY = {
  id: 'family',
  name: 'Family design',
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

/** tier: 'a' | 'b', extraOptions = count beyond 3 included (each @ extraOptionPrice) */
export function computePackagingPrice(pkg, tier, extraOptions) {
  if (!pkg) return { total: 0, base: 0, extraLine: 0, extraCount: 0 }
  const base = tier === 'a' ? pkg.tierA : pkg.tierB
  const x = Math.max(0, Number(extraOptions) || 0)
  const extraLine = x * pkg.extraOptionPrice
  return { total: base + extraLine, base, extraLine, extraCount: x, pkg }
}

export function initialPackState() {
  return Object.fromEntries(PACKAGING_PACKAGES.map((p) => [p.id, { tier: 'a', extraOptions: 0 }]))
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
