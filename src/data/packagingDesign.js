/** Packaging design — 3 package types (₹) */

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

/** tier: 'a' | 'b', extraOptions = count beyond 3 included (each @ extraOptionPrice) */
export function computePackagingPrice(pkg, tier, extraOptions) {
  if (!pkg) return { total: 0, base: 0, extraLine: 0, extraCount: 0 }
  const base = tier === 'a' ? pkg.tierA : pkg.tierB
  const x = Math.max(0, Number(extraOptions) || 0)
  const extraLine = x * pkg.extraOptionPrice
  return { total: base + extraLine, base, extraLine, extraCount: x, pkg }
}
