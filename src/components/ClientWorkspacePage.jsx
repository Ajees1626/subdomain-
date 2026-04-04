import { useEffect, useMemo, useState } from 'react'
import { SERVICES } from '../data/services.js'
import {
  clientHasApril2026Data,
  DASHBOARD_CLIENTS,
} from '../data/clientDashboard.js'
import { APRIL_2026_SHEET_TOTALS_ROWS } from '../data/april2026ClientMatrix.js'
import { formatMoney } from '../utils/money.js'
import {
  addCustomUpload,
  buildEffectiveUploads,
  isMonthComplete,
  listMonthsWithUploads,
  loadWorkspaceState,
  removeCustomUpload,
  saveWorkspaceState,
  setMonthComplete,
  setTypeOverride,
  splitByTypeAndDone,
  toggleDone,
} from '../utils/clientWorkspaceStorage.js'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function serviceLabels(ids) {
  if (!ids?.length) return '—'
  return ids
    .map((id) => SERVICES.find((s) => s.id === id)?.name ?? id)
    .join(' · ')
}

function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate()
}

function startWeekday(year, month0) {
  return new Date(year, month0, 1).getDay()
}

function ymKey(year, month0) {
  return `${year}-${String(month0 + 1).padStart(2, '0')}`
}

function parseDayUploads(uploadList, year, month0) {
  const map = new Map()
  const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}-`
  for (const u of uploadList) {
    if (!u.date.startsWith(prefix)) continue
    const day = Number(u.date.slice(8, 10))
    if (!map.has(day)) map.set(day, [])
    map.get(day).push(u)
  }
  return map
}

function countUploadsInListForMonth(uploadList, year, month0) {
  const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}-`
  return uploadList.filter((u) => u.date.startsWith(prefix)).length
}

function getUploadsInMonth(uploadList, year, month0) {
  const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}-`
  return uploadList.filter((u) => u.date.startsWith(prefix))
}

function countTypesInMonth(uploadList, year, month0) {
  const list = getUploadsInMonth(uploadList, year, month0)
  let posters = 0
  let reels = 0
  let mixed = 0
  for (const u of list) {
    if (u.type === 'mixed') mixed += 1
    else if (u.type === 'reel') reels += 1
    else posters += 1
  }
  return { total: list.length, posters, reels, mixed }
}

function typeLabel(t) {
  if (t === 'reel') return 'Reel'
  if (t === 'mixed') return 'Poster + reel'
  return 'Poster'
}

function MonthDetailSections({ uploads }) {
  const { finished, ongoing } = splitByTypeAndDone(uploads)
  const renderGroup = (label, bucket) => (
    <div className="client-ws-modal-group" key={label}>
      <h4 className="client-ws-modal-group-title">{label}</h4>
      <ul className="client-ws-modal-list">
        {['poster', 'reel', 'mixed'].map((k) => {
          const items = bucket[k]
          if (!items.length) return null
          return (
            <li key={k}>
              <span className="client-ws-modal-type-tag">{typeLabel(k)}</span>
              <ul>
                {items.map((u) => (
                  <li key={u.id}>
                    <time dateTime={u.date}>{u.date}</time>
                    {u.title ? ` · ${u.title}` : ''}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )

  const hasFinished =
    finished.poster.length + finished.reel.length + finished.mixed.length > 0
  const hasOngoing =
    ongoing.poster.length + ongoing.reel.length + ongoing.mixed.length > 0

  return (
    <div className="client-ws-modal-split">
      {hasFinished ? renderGroup('Finished (delivered)', finished) : null}
      {hasOngoing ? renderGroup('Ongoing (not marked finished)', ongoing) : null}
      {!hasFinished && !hasOngoing ? (
        <p className="client-ws-modal-empty">No items scheduled this month.</p>
      ) : null}
    </div>
  )
}

/**
 * Full-page client workspace (calendar + requirements), same navigation pattern as a service panel.
 */
export function ClientWorkspacePage({ initialClientId, onBack, onLogout }) {
  const [activeId, setActiveId] = useState(initialClientId ?? DASHBOARD_CLIENTS[0]?.id ?? '')
  const [detailTab, setDetailTab] = useState('calendar')
  const [calMode, setCalMode] = useState('month')
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [workspaceState, setWorkspaceState] = useState(() => loadWorkspaceState())
  const [editingUpload, setEditingUpload] = useState(null)
  const [editTypeDraft, setEditTypeDraft] = useState('poster')
  const [monthModalYm, setMonthModalYm] = useState(null)
  const [addForDay, setAddForDay] = useState(null)
  const [addTitle, setAddTitle] = useState('')
  const [addType, setAddType] = useState('poster')

  useEffect(() => {
    saveWorkspaceState(workspaceState)
  }, [workspaceState])

  useEffect(() => {
    if (initialClientId) setActiveId(initialClientId)
  }, [initialClientId])

  const client = useMemo(
    () => DASHBOARD_CLIENTS.find((c) => c.id === activeId) ?? DASHBOARD_CLIENTS[0],
    [activeId],
  )

  const aprilSheetRowForClient = useMemo(() => {
    if (!client?.id) return null
    const idx = APRIL_2026_SHEET_TOTALS_ROWS.findIndex((r) => r.id === client.id)
    if (idx < 0) return null
    return { row: APRIL_2026_SHEET_TOTALS_ROWS[idx], column: idx + 1 }
  }, [client.id])

  const mergedUploads = useMemo(
    () => (client ? buildEffectiveUploads(client.uploads, client.id, workspaceState) : []),
    [client, workspaceState],
  )

  const dayMap = useMemo(
    () => (client ? parseDayUploads(mergedUploads, calYear, calMonth) : new Map()),
    [client, mergedUploads, calYear, calMonth],
  )

  const baselineUploadMap = useMemo(() => {
    const m = new Map()
    for (const u of client?.uploads ?? []) {
      if (u.id) m.set(u.id, u)
    }
    for (const u of workspaceState.customUploads?.[client?.id] ?? []) {
      m.set(u.id, u)
    }
    return m
  }, [client, workspaceState.customUploads])

  const currentYm = ymKey(calYear, calMonth)
  const monthsWithContent = useMemo(
    () =>
      client
        ? listMonthsWithUploads(buildEffectiveUploads(client.uploads, client.id, workspaceState))
        : [],
    [client, workspaceState],
  )
  const uploadsThisViewMonth = useMemo(
    () => getUploadsInMonth(mergedUploads, calYear, calMonth),
    [mergedUploads, calYear, calMonth],
  )
  const monthStats = useMemo(() => splitByTypeAndDone(uploadsThisViewMonth), [uploadsThisViewMonth])
  const finishedCount =
    monthStats.finished.poster.length +
    monthStats.finished.reel.length +
    monthStats.finished.mixed.length
  const ongoingCount =
    monthStats.ongoing.poster.length +
    monthStats.ongoing.reel.length +
    monthStats.ongoing.mixed.length

  useEffect(() => {
    const c = DASHBOARD_CLIENTS.find((x) => x.id === activeId)
    if (c && clientHasApril2026Data(c)) {
      setCalYear(2026)
      setCalMonth(3)
    }
  }, [activeId])

  useEffect(() => {
    if (!editingUpload) return
    setEditTypeDraft(editingUpload.type === 'mixed' ? 'mixed' : editingUpload.type === 'reel' ? 'reel' : 'poster')
  }, [editingUpload])

  if (!client) {
    return null
  }

  const monthCompleteForView = isMonthComplete(workspaceState, client.id, currentYm)
  const hasUploadsThisMonth = uploadsThisViewMonth.length > 0

  const openEdit = (u) => {
    setEditingUpload(u)
  }

  const saveEditType = () => {
    if (!editingUpload) return
    const base = baselineUploadMap.get(editingUpload.id)
    const baselineType = base?.type ?? 'poster'
    setWorkspaceState((ws) => {
      if (editTypeDraft === baselineType) return setTypeOverride(ws, editingUpload.id, null)
      return setTypeOverride(ws, editingUpload.id, editTypeDraft)
    })
    setEditingUpload(null)
  }

  const saveNewItem = () => {
    if (addForDay == null) return
    const date = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(addForDay).padStart(2, '0')}`
    setWorkspaceState((ws) => addCustomUpload(ws, client.id, { date, type: addType, title: addTitle }))
    setAddForDay(null)
    setAddTitle('')
  }

  const dim = daysInMonth(calYear, calMonth)
  const start = startWeekday(calYear, calMonth)
  const blanks = Array.from({ length: start }, (_, i) => (
    <div key={`b-${i}`} className="admin-cal-cell admin-cal-cell--empty" />
  ))
  const cells = Array.from({ length: dim }, (_, i) => {
    const d = i + 1
    const list = dayMap.get(d) ?? []
    return (
      <div
        key={d}
        className={`admin-cal-cell ${list.length ? 'admin-cal-cell--has' : 'admin-cal-cell--addable'}`}
      >
        <span className="admin-cal-daynum">{d}</span>
        {list.length > 0 && (
          <ul className="admin-cal-day-list">
            {list.map((u) => (
              <li
                key={u.id}
                className={`admin-cal-pill admin-cal-pill--${u.type === 'mixed' ? 'mixed' : u.type} ${u.done ? 'admin-cal-pill--done' : ''}`}
              >
                <div className="admin-cal-pill-main">
                  <span className="admin-cal-pill-type">{typeLabel(u.type)}</span>
                  {u.title ? <span className="admin-cal-pill-title">{u.title}</span> : null}
                </div>
                <div className="admin-cal-pill-actions">
                  <label className="admin-cal-pill-done">
                    <input
                      type="checkbox"
                      checked={u.done}
                      onChange={() =>
                        setWorkspaceState((ws) => toggleDone(ws, u.id))
                      }
                      aria-label="Mark finished"
                    />
                    <span className="admin-cal-pill-done-text">Done</span>
                  </label>
                  <button
                    type="button"
                    className="admin-cal-pill-edit"
                    onClick={() => openEdit(u)}
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="admin-cal-cell-footer">
          <button
            type="button"
            className="admin-cal-add-btn"
            onClick={() => {
              setAddForDay(d)
              setAddTitle('')
              setAddType('poster')
            }}
          >
            + Add
          </button>
        </div>
      </div>
    )
  })

  const modalYmUploads = monthModalYm
    ? mergedUploads.filter((u) => u.date.startsWith(`${monthModalYm}-`))
    : []

  const modalYmLabel = monthModalYm
    ? (() => {
        const [y, m] = monthModalYm.split('-')
        return `${MONTH_NAMES[Number(m) - 1]} ${y}`
      })()
    : ''

  return (
    <div className="client-workspace-page">
      <header className="client-workspace-topbar">
        <button type="button" className="client-workspace-back px-btn px-btn--outline px-btn--sm" onClick={onBack}>
          ← Back to home
        </button>
        <div className="client-workspace-topbar-meta">
          <span className="client-workspace-kicker">Pixdot</span>
          <span className="client-workspace-title">Client workspace</span>
        </div>
      </header>

      <div className="client-workspace-body">
        <section className="admin-dash admin-dash--detail admin-dash--fullpage" aria-label="Client workspace">
          <div className="admin-dash-split">
            <aside className="admin-dash-side" aria-label="Clients">
              <div className="admin-dash-side-scroll">
                <p className="admin-dash-side-label">Clients</p>
                <ul className="admin-dash-side-list">
                  {DASHBOARD_CLIENTS.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`admin-dash-side-btn ${c.id === activeId ? 'is-active' : ''}`}
                        onClick={() => setActiveId(c.id)}
                      >
                        <span className="admin-dash-side-initials">{c.initials}</span>
                        <span className="admin-dash-side-name">{c.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {onLogout ? (
                <div className="admin-dash-side-footer">
                  <button
                    type="button"
                    className="admin-dash-side-logout px-btn px-btn--outline px-btn--block px-btn--sm"
                    onClick={onLogout}
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </aside>
            <div className="admin-dash-main">
              <div className="admin-dash-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailTab === 'calendar'}
                  className={`admin-dash-tab ${detailTab === 'calendar' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('calendar')}
                >
                  Calendar
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailTab === 'requirements'}
                  className={`admin-dash-tab ${detailTab === 'requirements' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('requirements')}
                >
                  Client requirements
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailTab === 'complete'}
                  className={`admin-dash-tab ${detailTab === 'complete' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('complete')}
                >
                  Complete
                </button>
              </div>

              {detailTab === 'calendar' && (
                <div className="admin-dash-panel">
                  <div className="client-ws-month-strip">
                    <div className="client-ws-month-strip-head">
                      <p className="client-ws-month-strip-label">Months with scheduled content</p>
                      {hasUploadsThisMonth && (
                        <button
                          type="button"
                          className={`client-ws-month-complete-btn ${monthCompleteForView ? 'is-on' : ''}`}
                          onClick={() =>
                            setWorkspaceState((ws) =>
                              setMonthComplete(ws, client.id, currentYm, !monthCompleteForView),
                            )
                          }
                        >
                          {monthCompleteForView ? 'Month marked complete ✓' : 'Mark this month complete'}
                        </button>
                      )}
                    </div>
                    <div className="client-ws-month-chips">
                      {monthsWithContent.map(({ ym, count }) => {
                        const [y, m] = ym.split('-').map(Number)
                        const complete = isMonthComplete(workspaceState, client.id, ym)
                        const isCal = calYear === y && calMonth === m - 1
                        return (
                          <button
                            key={ym}
                            type="button"
                            className={`client-ws-month-chip ${complete ? 'is-complete' : ''} ${count > 0 && !complete ? 'is-ongoing' : ''} ${isCal ? 'is-cal' : ''}`}
                            onClick={() => {
                              setCalYear(y)
                              setCalMonth(m - 1)
                              setCalMode('month')
                              setMonthModalYm(ym)
                            }}
                          >
                            <span className="client-ws-month-chip-main">
                              {MONTH_NAMES[m - 1]} {y}
                            </span>
                            <span
                              className={`client-ws-month-chip-status ${complete ? 'is-status-complete' : count > 0 ? 'is-status-ongoing' : ''}`}
                            >
                              {complete ? 'Complete' : count > 0 ? 'Ongoing' : '—'}
                            </span>
                            <span className="client-ws-month-chip-count">{count} items</span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="client-ws-month-strip-hint">
                      Click a month to open the calendar on that month and see finished vs ongoing breakdown. On any
                      day, use <strong>+ Add</strong> to schedule posters or reels (saved in this browser — e.g. May 2026).
                    </p>
                  </div>

                  <div className="admin-cal-toolbar">
                    <div className="admin-cal-mode">
                      <button
                        type="button"
                        className={`admin-cal-mode-btn ${calMode === 'month' ? 'is-active' : ''}`}
                        onClick={() => setCalMode('month')}
                      >
                        Month
                      </button>
                      <button
                        type="button"
                        className={`admin-cal-mode-btn ${calMode === 'year' ? 'is-active' : ''}`}
                        onClick={() => setCalMode('year')}
                      >
                        Year
                      </button>
                    </div>
                    {calMode === 'month' && (
                      <div className="admin-cal-nav">
                        <button
                          type="button"
                          className="admin-cal-arrow"
                          aria-label="Previous month"
                          onClick={() => {
                            if (calMonth === 0) {
                              setCalMonth(11)
                              setCalYear((y) => y - 1)
                            } else setCalMonth((m) => m - 1)
                          }}
                        >
                          ‹
                        </button>
                        <span className="admin-cal-heading">
                          {MONTH_NAMES[calMonth]} {calYear}
                          {hasUploadsThisMonth ? (
                            <span
                              className={`admin-cal-heading-badge ${monthCompleteForView ? 'admin-cal-heading-badge--complete' : 'admin-cal-heading-badge--ongoing'}`}
                            >
                              {monthCompleteForView ? 'Complete' : 'Ongoing'}
                            </span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          className="admin-cal-arrow"
                          aria-label="Next month"
                          onClick={() => {
                            if (calMonth === 11) {
                              setCalMonth(0)
                              setCalYear((y) => y + 1)
                            } else setCalMonth((m) => m + 1)
                          }}
                        >
                          ›
                        </button>
                      </div>
                    )}
                    {calMode === 'year' && (
                      <div className="admin-cal-year-label">
                        <button
                          type="button"
                          className="admin-cal-arrow"
                          aria-label="Previous year"
                          onClick={() => setCalYear((y) => y - 1)}
                        >
                          ‹
                        </button>
                        <span className="admin-cal-heading">{calYear}</span>
                        <button
                          type="button"
                          className="admin-cal-arrow"
                          aria-label="Next year"
                          onClick={() => setCalYear((y) => y + 1)}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>

                  {calMode === 'month' && (
                    <div className="admin-cal-grid-wrap">
                      <div className="admin-cal-dow">
                        {WEEKDAYS.map((w) => (
                          <div key={w} className="admin-cal-dow-cell">
                            {w}
                          </div>
                        ))}
                      </div>
                      <div className="admin-cal-grid">
                        {blanks}
                        {cells}
                      </div>
                    </div>
                  )}

                  {calMode === 'year' && (
                    <div className="admin-cal-year-grid">
                      {MONTH_NAMES.map((name, mi) => {
                        const n = countUploadsInListForMonth(mergedUploads, calYear, mi)
                        const ym = ymKey(calYear, mi)
                        const complete = isMonthComplete(workspaceState, client.id, ym)
                        return (
                          <button
                            key={name}
                            type="button"
                            className={`admin-cal-year-cell ${complete && n > 0 ? 'is-month-complete' : ''} ${!complete && n > 0 ? 'is-month-ongoing' : ''}`}
                            onClick={() => {
                              setCalMonth(mi)
                              setCalMode('month')
                            }}
                          >
                            <span className="admin-cal-year-name">{name}</span>
                            <span className="admin-cal-year-count">
                              {n} upload{n === 1 ? '' : 's'}
                              {n > 0 ? (complete ? ' · ✓' : ' · ongoing') : ''}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {client.nextScheduled && (
                    <div className="admin-cal-next">
                      <span className="admin-cal-next-label">Next upload scheduled</span>
                      <strong className="admin-cal-next-date">{client.nextScheduled.date}</strong>
                      <span className="admin-cal-next-meta">
                        {client.nextScheduled.type === 'reel' ? 'Reel' : 'Poster'}
                        {client.nextScheduled.title ? ` · ${client.nextScheduled.title}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'requirements' && (
                <div className="admin-dash-panel admin-req">
                  <div className="admin-req-top-extra">
                    <div className="admin-req-top-extra-inner">
                      <span className="admin-req-top-extra-month">
                        <button
                          type="button"
                          className="admin-req-top-extra-arrow"
                          aria-label="Previous month"
                          onClick={() => {
                            if (calMonth === 0) {
                              setCalMonth(11)
                              setCalYear((y) => y - 1)
                            } else setCalMonth((m) => m - 1)
                          }}
                        >
                          ‹
                        </button>
                        <strong>
                          {MONTH_NAMES[calMonth]} {calYear}
                        </strong>
                        <button
                          type="button"
                          className="admin-req-top-extra-arrow"
                          aria-label="Next month"
                          onClick={() => {
                            if (calMonth === 11) {
                              setCalMonth(0)
                              setCalYear((y) => y + 1)
                            } else setCalMonth((m) => m + 1)
                          }}
                        >
                          ›
                        </button>
                      </span>
                      <span className="admin-req-top-extra-stats">
                        <span className="admin-req-stat-ongoing">Ongoing {ongoingCount}</span>
                        <span className="admin-req-stat-sep">·</span>
                        <span className="admin-req-stat-done">Finished {finishedCount}</span>
                        {hasUploadsThisMonth ? (
                          <span
                            className={`admin-req-top-extra-pill ${monthCompleteForView ? 'is-complete' : 'is-ongoing'}`}
                          >
                            {monthCompleteForView
                              ? 'Month complete'
                              : calYear === now.getFullYear() && calMonth === now.getMonth()
                                ? 'Current month · Ongoing'
                                : 'Ongoing'}
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        className="admin-req-top-extra-link"
                        onClick={() => setDetailTab('complete')}
                      >
                        Complete overview →
                      </button>
                    </div>
                  </div>

                  <h3 className="admin-req-client">{client.name}</h3>
                  <p className="admin-req-services">{serviceLabels(client.serviceIds)}</p>

                  <div className="admin-req-table-wrap">
                    <h4 className="admin-req-section-title">Line items</h4>
                    <table className="admin-req-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.requirements.items.map((row, i) => (
                          <tr key={i}>
                            <td>{row.label}</td>
                            <td className="admin-req-amt">{formatMoney(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="admin-req-total">
                    <span>Subtotal</span>
                    <strong>
                      {formatMoney(client.requirements.items.reduce((s, r) => s + r.amount, 0))}
                    </strong>
                  </p>
                  <div className="admin-req-notes-card admin-req-sheet-card admin-req-sheet-card--solo">
                    <h4 className="admin-req-section-title">April 2026 — your targets</h4>
                    {client.requirements.notes ? (
                      <p className="admin-req-notes-lead">{client.requirements.notes}</p>
                    ) : null}
                    {aprilSheetRowForClient ? (
                      <>
                        <div className="admin-req-sheet-table-scroll">
                          <table className="admin-req-sheet-table admin-req-sheet-table--solo">
                            <thead>
                              <tr>
                                <th scope="col">Sheet col.</th>
                                <th scope="col">Brand</th>
                                <th scope="col">Posters</th>
                                <th scope="col">Reels / video</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="admin-req-sheet-row--you">
                                <td className="admin-req-sheet-num">{aprilSheetRowForClient.column}</td>
                                <td className="admin-req-sheet-brand">{aprilSheetRowForClient.row.name}</td>
                                <td>{aprilSheetRowForClient.row.posters}</td>
                                <td className="admin-req-sheet-reels">
                                  {aprilSheetRowForClient.row.reelsSummary}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="admin-req-sheet-legend admin-req-sheet-legend--compact">
                          <strong>Posters</strong> — planned poster count for April. <strong>Reels / video</strong> —
                          reels or video + AI mix from the sheet. <strong>—</strong> means no value in the master sheet
                          for that field.
                        </p>
                      </>
                    ) : (
                      <p className="admin-req-notes-lead">No April 2026 sheet row is configured for this client.</p>
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'complete' && (
                <div className="admin-dash-panel client-ws-complete-tab">
                  <p className="client-ws-complete-intro">
                    <strong>{client.name}</strong> — click a month to open the calendar. Green = month marked complete;
                    orange = ongoing (still has open work).
                  </p>
                  <div className="client-ws-complete-year-nav">
                    <button
                      type="button"
                      className="admin-cal-arrow"
                      aria-label="Previous year"
                      onClick={() => setCalYear((y) => y - 1)}
                    >
                      ‹
                    </button>
                    <span className="client-ws-complete-year-label">{calYear}</span>
                    <button
                      type="button"
                      className="admin-cal-arrow"
                      aria-label="Next year"
                      onClick={() => setCalYear((y) => y + 1)}
                    >
                      ›
                    </button>
                  </div>
                  <div className="client-ws-complete-grid">
                    {MONTH_NAMES.map((name, mi) => {
                      const counts = countTypesInMonth(mergedUploads, calYear, mi)
                      const ym = ymKey(calYear, mi)
                      const complete = isMonthComplete(workspaceState, client.id, ym)
                      const hasItems = counts.total > 0
                      const isLiveMonth = calYear === now.getFullYear() && mi === now.getMonth()
                      const cardTone =
                        complete && hasItems ? 'is-complete' : hasItems ? 'is-ongoing' : 'is-empty'
                      const bits = []
                      if (counts.posters) bits.push(`Posters ${counts.posters}`)
                      if (counts.reels) bits.push(`Reels ${counts.reels}`)
                      if (counts.mixed) bits.push(`Poster+Reel ${counts.mixed}`)
                      const countLine = bits.length ? bits.join(' · ') : 'No schedule'
                      const statusLabel = !hasItems
                        ? '—'
                        : complete
                          ? 'Complete'
                          : isLiveMonth
                            ? 'Current · Ongoing'
                            : 'Ongoing'
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`client-ws-complete-card ${cardTone}`}
                          onClick={() => {
                            setCalMonth(mi)
                            setCalMode('month')
                            setDetailTab('calendar')
                          }}
                        >
                          <span className="client-ws-complete-card-month">{name}</span>
                          <span className="client-ws-complete-card-counts">{countLine}</span>
                          <span
                            className={`client-ws-complete-card-status ${complete ? 'is-status-complete' : hasItems ? 'is-status-ongoing' : ''}`}
                          >
                            {statusLabel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {editingUpload && (
        <div
          className="client-ws-overlay"
          role="presentation"
          onClick={() => setEditingUpload(null)}
        >
          <div
            className="client-ws-dialog"
            role="dialog"
            aria-labelledby="client-ws-edit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="client-ws-edit-title" className="client-ws-dialog-title">
              Edit type · {editingUpload.date}
            </h3>
            <p className="client-ws-dialog-sub">{editingUpload.title}</p>
            <fieldset className="client-ws-type-fieldset">
              <legend className="client-ws-sr-only">Content type</legend>
              {['poster', 'reel', 'mixed'].map((t) => (
                <label key={t} className="client-ws-type-option">
                  <input
                    type="radio"
                    name="edit-type"
                    value={t}
                    checked={editTypeDraft === t}
                    onChange={() => setEditTypeDraft(t)}
                  />
                  {typeLabel(t)}
                </label>
              ))}
            </fieldset>
            <div className="client-ws-dialog-actions">
              {editingUpload.isCustom ? (
                <button
                  type="button"
                  className="client-ws-btn client-ws-btn--danger"
                  onClick={() => {
                    setWorkspaceState((ws) => removeCustomUpload(ws, client.id, editingUpload.id))
                    setEditingUpload(null)
                  }}
                >
                  Delete
                </button>
              ) : null}
              <button type="button" className="client-ws-btn client-ws-btn--primary" onClick={saveEditType}>
                Save
              </button>
              <button type="button" className="client-ws-btn" onClick={() => setEditingUpload(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {addForDay != null && (
        <div
          className="client-ws-overlay"
          role="presentation"
          onClick={() => setAddForDay(null)}
        >
          <div
            className="client-ws-dialog"
            role="dialog"
            aria-labelledby="client-ws-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="client-ws-add-title" className="client-ws-dialog-title">
              Add schedule · {MONTH_NAMES[calMonth]} {addForDay}, {calYear}
            </h3>
            <p className="client-ws-dialog-sub">
              New entry for <strong>{client.name}</strong>. Stored only in this browser until you add server sync.
            </p>
            <label className="client-ws-add-label">
              <span className="client-ws-add-label-text">Title / note</span>
              <input
                type="text"
                className="client-ws-add-input"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="e.g. Poster - 3, reels - 2"
                autoFocus
              />
            </label>
            <fieldset className="client-ws-type-fieldset">
              <legend className="client-ws-sr-only">Content type</legend>
              {['poster', 'reel', 'mixed'].map((t) => (
                <label key={t} className="client-ws-type-option">
                  <input
                    type="radio"
                    name="add-type"
                    value={t}
                    checked={addType === t}
                    onChange={() => setAddType(t)}
                  />
                  {typeLabel(t)}
                </label>
              ))}
            </fieldset>
            <div className="client-ws-dialog-actions">
              <button type="button" className="client-ws-btn client-ws-btn--primary" onClick={saveNewItem}>
                Add to calendar
              </button>
              <button type="button" className="client-ws-btn" onClick={() => setAddForDay(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {monthModalYm && (
        <div
          className="client-ws-overlay"
          role="presentation"
          onClick={() => setMonthModalYm(null)}
        >
          <div
            className="client-ws-dialog client-ws-dialog--wide"
            role="dialog"
            aria-labelledby="client-ws-month-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="client-ws-month-title" className="client-ws-dialog-title">
              {client.name} · {modalYmLabel}
            </h3>
            <p className="client-ws-dialog-sub">
              {isMonthComplete(workspaceState, client.id, monthModalYm)
                ? 'This month is marked complete.'
                : 'This month is ongoing — finish items on the calendar.'}
            </p>
            <MonthDetailSections uploads={modalYmUploads} />
            <div className="client-ws-dialog-actions">
              <button type="button" className="client-ws-btn client-ws-btn--primary" onClick={() => setMonthModalYm(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
