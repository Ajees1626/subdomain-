export function formatMoney(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

export function formatRange(min, max) {
  if (max == null) return `${formatMoney(min)}+`
  return `${formatMoney(min)} – ${formatMoney(max)}`
}
