/**
 * Admin workspace — built from April 2026 multi-client grid (see april2026ClientMatrix.js).
 */

import {
  APRIL_2026_CLIENT_DEFS,
  buildUploadsForClientColumn,
  nextScheduledFromUploads,
} from './april2026ClientMatrix.js'
import { getPortalProfile, getPortalServiceIds } from './clientPortalProfiles.js'
import { SERVICES } from './services.js'

const VALID_SERVICE_IDS = new Set(SERVICES.map((s) => s.id))

/** Dedupe + only real `services.js` ids — sidebar / details use this list only. */
export function normalizeClientServiceIds(raw) {
  if (!Array.isArray(raw) || !raw.length) return []
  const seen = new Set()
  const out = []
  for (const id of raw) {
    const s = String(id).trim()
    if (!s || seen.has(s) || !VALID_SERVICE_IDS.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

export function resolveClientChosenServiceIds(client) {
  return normalizeClientServiceIds(client?.serviceIds)
}

export function resolveClientChosenServices(client) {
  return resolveClientChosenServiceIds(client)
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean)
}

function serviceNamesSummary(ids) {
  return ids
    .map((id) => SERVICES.find((s) => s.id === id)?.name ?? id)
    .join(' · ')
}

function buildClients() {
  return APRIL_2026_CLIENT_DEFS.map((def, index) => {
    const uploads = buildUploadsForClientColumn(index, def.id)
    const serviceIds = normalizeClientServiceIds(getPortalServiceIds(def.id))
    return {
      id: def.id,
      name: def.name,
      initials: def.initials,
      logoUrl: null,
      servicesSummary: serviceIds.length
        ? `${serviceNamesSummary(serviceIds)} · Apr 2026`
        : 'Apr 2026 — add services in client profile',
      serviceIds,
      portal: getPortalProfile(def.id),
      requirements: {
        items: [{ label: `${def.name} — April 2026 content calendar`, amount: 24999 }],
        notes:
          'Planned poster and reel totals for April 2026 from the master sheet — only your brand is shown here.',
      },
      uploads,
      nextScheduled: nextScheduledFromUploads(uploads),
    }
  })
}

export const DASHBOARD_CLIENTS = buildClients()

export function getDashboardClientById(clientId) {
  return DASHBOARD_CLIENTS.find((c) => c.id === clientId) ?? null
}

export function getUploadsForMonth(client, year, monthIndex0) {
  const y = String(year)
  const m = String(monthIndex0 + 1).padStart(2, '0')
  const prefix = `${y}-${m}-`
  return (client?.uploads ?? []).filter((u) => u.date.startsWith(prefix))
}

export function countUploadsInMonth(client, year, monthIndex0) {
  return getUploadsForMonth(client, year, monthIndex0).length
}

export function clientHasApril2026Data(client) {
  return (client?.uploads ?? []).some((u) => u.date.startsWith('2026-04'))
}
