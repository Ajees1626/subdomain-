const STORAGE_KEY = 'pixdot_workspace_v1'

function defaultState() {
  return {
    typeOverrides: {},
    done: {},
    monthComplete: {},
    customUploads: {},
  }
}

export function loadWorkspaceState() {
  if (typeof window === 'undefined' || !window.localStorage) return defaultState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return {
      typeOverrides: typeof parsed.typeOverrides === 'object' && parsed.typeOverrides ? parsed.typeOverrides : {},
      done: typeof parsed.done === 'object' && parsed.done ? parsed.done : {},
      monthComplete:
        typeof parsed.monthComplete === 'object' && parsed.monthComplete ? parsed.monthComplete : {},
      customUploads:
        typeof parsed.customUploads === 'object' && parsed.customUploads ? parsed.customUploads : {},
    }
  } catch {
    return defaultState()
  }
}

export function saveWorkspaceState(state) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

export function mergeUploadsWithWorkspace(uploads, clientId, ws) {
  return (uploads ?? []).map((u) => {
    const id = u.id ?? `${clientId}:${u.date}`
    const ov = ws.typeOverrides[id]
    const type = ov === 'poster' || ov === 'reel' || ov === 'mixed' ? ov : u.type
    const done = !!ws.done[id]
    return { ...u, id, type, done }
  })
}

/** Base sheet uploads + per-client custom rows (saved in localStorage). */
export function buildEffectiveUploads(baseUploads, clientId, ws) {
  const mergedBase = mergeUploadsWithWorkspace(baseUploads, clientId, ws).map((u) => ({
    ...u,
    isCustom: false,
  }))
  const rawCustom = ws.customUploads?.[clientId] ?? []
  const customs = rawCustom.map((u) => {
    const ov = ws.typeOverrides[u.id]
    const type = ov === 'poster' || ov === 'reel' || ov === 'mixed' ? ov : u.type
    const done = !!ws.done[u.id]
    return { ...u, type, done, isCustom: true }
  })
  return [...mergedBase, ...customs]
}

export function addCustomUpload(ws, clientId, { date, type, title }) {
  const id = `${clientId}:${date}:c:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const row = {
    id,
    date,
    type: type === 'reel' || type === 'mixed' ? type : 'poster',
    title: String(title ?? '').trim() || 'Custom',
  }
  const next = { ...ws, customUploads: { ...ws.customUploads } }
  const list = [...(next.customUploads[clientId] ?? []), row]
  next.customUploads[clientId] = list
  return next
}

export function removeCustomUpload(ws, clientId, uploadId) {
  const next = { ...ws, customUploads: { ...ws.customUploads } }
  const list = (next.customUploads[clientId] ?? []).filter((u) => u.id !== uploadId)
  if (list.length === 0) delete next.customUploads[clientId]
  else next.customUploads[clientId] = list
  const done = { ...next.done }
  delete done[uploadId]
  const typeOverrides = { ...next.typeOverrides }
  delete typeOverrides[uploadId]
  return { ...next, done, typeOverrides }
}

export function setTypeOverride(ws, uploadId, type) {
  const next = { ...ws, typeOverrides: { ...ws.typeOverrides } }
  if (type === null || type === undefined) {
    delete next.typeOverrides[uploadId]
  } else {
    next.typeOverrides[uploadId] = type
  }
  return next
}

export function toggleDone(ws, uploadId) {
  const next = { ...ws, done: { ...ws.done } }
  if (next.done[uploadId]) delete next.done[uploadId]
  else next.done[uploadId] = true
  return next
}

export function setMonthComplete(ws, clientId, ym, value) {
  const next = { ...ws, monthComplete: { ...ws.monthComplete } }
  const per = { ...(next.monthComplete[clientId] ?? {}) }
  if (value) per[ym] = true
  else delete per[ym]
  if (Object.keys(per).length === 0) delete next.monthComplete[clientId]
  else next.monthComplete[clientId] = per
  return next
}

export function isMonthComplete(ws, clientId, ym) {
  return !!ws.monthComplete[clientId]?.[ym]
}

export function listMonthsWithUploads(uploads) {
  const map = new Map()
  for (const u of uploads ?? []) {
    const ym = u.date.slice(0, 7)
    map.set(ym, (map.get(ym) || 0) + 1)
  }
  return [...map.entries()]
    .map(([ym, count]) => ({ ym, count }))
    .sort((a, b) => a.ym.localeCompare(b.ym))
}

export function splitByTypeAndDone(uploads) {
  const finished = { poster: [], reel: [], mixed: [] }
  const ongoing = { poster: [], reel: [], mixed: [] }
  for (const u of uploads) {
    const bucket = u.done ? finished : ongoing
    const t = u.type === 'mixed' ? 'mixed' : u.type === 'reel' ? 'reel' : 'poster'
    bucket[t].push(u)
  }
  return { finished, ongoing }
}
