export function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate()
}

export function startWeekday(year, month0) {
  return new Date(year, month0, 1).getDay()
}

export function parseDayUploads(uploadList, year, month0) {
  const map = new Map()
  const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}-`
  for (const u of uploadList ?? []) {
    if (!u.date.startsWith(prefix)) continue
    const day = Number(u.date.slice(8, 10))
    if (!map.has(day)) map.set(day, [])
    map.get(day).push(u)
  }
  return map
}

export function typeLabel(t) {
  if (t === 'reel') return 'Reel'
  if (t === 'mixed') return 'Poster + reel'
  return 'Poster'
}
