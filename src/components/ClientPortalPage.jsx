import { useEffect, useMemo, useState } from 'react'
import {
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6'
import { SERVICES } from '../data/services.js'
import {
  clientHasApril2026Data,
  getDashboardClientById,
  normalizeClientServiceIds,
  resolveClientChosenServiceIds,
  resolveClientChosenServices,
} from '../data/clientDashboard.js'
import {
  daysInMonth,
  parseDayUploads,
  startWeekday,
  typeLabel,
} from '../utils/calendarMonthUtils.js'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pickSocialIcon(url, label) {
  const u = `${url} ${label}`.toLowerCase()
  if (u.includes('instagram')) return FaInstagram
  if (u.includes('facebook')) return FaFacebookF
  if (u.includes('youtube')) return FaYoutube
  if (u.includes('linkedin')) return FaLinkedinIn
  if (u.includes('twitter') || u.includes('x.com')) return FaXTwitter
  return FaGlobe
}

function activeServiceId(view) {
  if (!view?.startsWith('service:')) return null
  return view.slice('service:'.length)
}

/**
 * Client portal: left sidebar (calendar, details, social, each service) → right main panel.
 */
export function ClientPortalPage({ user, onLogout, onMoreServices }) {
  const client = user?.clientId ? getDashboardClientById(user.clientId) : null
  const portal = client?.portal
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [activeView, setActiveView] = useState('calendar')

  useEffect(() => {
    if (client && clientHasApril2026Data(client)) {
      setCalYear(2026)
      setCalMonth(3)
    }
  }, [client?.id])

  const dayMap = useMemo(() => {
    if (!client) return new Map()
    return parseDayUploads(client.uploads, calYear, calMonth)
  }, [client, calYear, calMonth])

  /** Only services chosen for this client (profile). Optional user.chosenServiceIds narrows to signup picks. */
  const chosenServices = useMemo(() => {
    if (!client) return []
    const baseIds = resolveClientChosenServiceIds(client)
    const userPick = normalizeClientServiceIds(user?.chosenServiceIds)
    if (userPick.length > 0) {
      const allowed = new Set(baseIds)
      const narrowed = userPick.filter((id) => allowed.has(id))
      if (narrowed.length > 0) {
        return narrowed.map((id) => SERVICES.find((s) => s.id === id)).filter(Boolean)
      }
    }
    return resolveClientChosenServices(client)
  }, [client, user?.chosenServiceIds])

  const workLine = useMemo(() => {
    const names = chosenServices.map((s) => s.name).join(' · ')
    if (names) {
      return `${names} — check the calendar for poster, reel, and mixed posts (view only).`
    }
    return 'Your scheduled content with Pixdot — calendar is view only.'
  }, [chosenServices])

  if (!user?.clientId) {
    return (
      <div className="client-portal client-portal--missing">
        <p>This account is not set up as a client portal. Contact Pixdot.</p>
        <button type="button" className="px-btn px-btn--outline px-btn--sm" onClick={onLogout}>
          Log out
        </button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="client-portal client-portal--missing">
        <p>No client profile found for this login. Contact Pixdot.</p>
        <button type="button" className="px-btn px-btn--outline px-btn--sm" onClick={onLogout}>
          Log out
        </button>
      </div>
    )
  }

  const dim = daysInMonth(calYear, calMonth)
  const start = startWeekday(calYear, calMonth)
  const blanks = Array.from({ length: start }, (_, i) => (
    <div key={`b-${i}`} className="client-portal-cal-cell client-portal-cal-cell--empty" />
  ))
  const cells = Array.from({ length: dim }, (_, i) => {
    const d = i + 1
    const list = dayMap.get(d) ?? []
    return (
      <div key={d} className={`client-portal-cal-cell ${list.length ? 'client-portal-cal-cell--has' : ''}`}>
        <span className="client-portal-cal-daynum">{d}</span>
        {list.length > 0 && (
          <ul className="client-portal-cal-list">
            {list.map((u) => (
              <li
                key={u.id}
                className={`client-portal-cal-pill client-portal-cal-pill--${u.type === 'mixed' ? 'mixed' : u.type}`}
              >
                <span className="client-portal-cal-pill-type">{typeLabel(u.type)}</span>
                {u.title ? <span className="client-portal-cal-pill-title">{u.title}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  })

  const hasPhones = portal?.ownerPhones?.length > 0
  const hasEmails = portal?.ownerEmails?.length > 0
  const hasSocial = portal?.socialLinks?.length > 0
  const reqItems = client.requirements?.items ?? []
  const reqNotes = client.requirements?.notes

  const sid = activeServiceId(activeView)
  const focusedService = sid ? chosenServices.find((s) => s.id === sid) : null

  const calendarBlock = (
    <div className="client-portal-cal client-portal-cal--main">
      <div className="client-portal-cal-head">
        <h2 className="client-portal-section-title">Calendar</h2>
        <p className="client-portal-hint">View only — no edits. Pixdot updates your schedule.</p>
        <div className="client-portal-cal-nav">
          <button
            type="button"
            className="client-portal-cal-arrow"
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
          <span className="client-portal-cal-heading">
            {MONTH_NAMES[calMonth]} {calYear}
          </span>
          <button
            type="button"
            className="client-portal-cal-arrow"
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
      </div>
      <div className="client-portal-cal-grid-wrap">
        <div className="client-portal-cal-dow">
          {WEEKDAYS.map((w) => (
            <div key={w} className="client-portal-cal-dow-cell">
              {w}
            </div>
          ))}
        </div>
        <div className="client-portal-cal-grid">
          {blanks}
          {cells}
        </div>
      </div>
    </div>
  )

  const detailsBlock = (
    <div className="client-portal-main-stack">
      <section className="client-portal-card client-portal-card--flush" aria-labelledby="cp-services">
        <h2 id="cp-services" className="client-portal-section-title">
          Your chosen services
        </h2>
        {chosenServices.length > 0 ? (
          <ul className="client-portal-service-list">
            {chosenServices.map((s) => (
              <li key={s.id} className="client-portal-service-item">
                <span className="client-portal-service-name">{s.name}</span>
                <span className="client-portal-service-tag">{s.tagline}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="client-portal-empty">Nothing listed yet — Pixdot will show only the services you selected.</p>
        )}
      </section>

      <section className="client-portal-card client-portal-card--flush" aria-labelledby="cp-req">
        <h2 id="cp-req" className="client-portal-section-title">
          Project detail
        </h2>
        {reqNotes ? <p className="client-portal-detail-notes">{reqNotes}</p> : null}
        {reqItems.length > 0 ? (
          <ul className="client-portal-req-list">
            {reqItems.map((it, i) => (
              <li key={i} className="client-portal-req-item">
                <span className="client-portal-req-label">{it.label}</span>
                {it.amount != null ? (
                  <span className="client-portal-req-amt">₹{Number(it.amount).toLocaleString('en-IN')}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {!reqNotes && reqItems.length === 0 ? (
          <p className="client-portal-empty">More detail will appear when Pixdot adds it to your workspace.</p>
        ) : null}
      </section>

      <section className="client-portal-card client-portal-card--flush" aria-labelledby="cp-contact">
        <h2 id="cp-contact" className="client-portal-section-title">
          Owner / contact
        </h2>
        {hasPhones ? (
          <div className="client-portal-contact-block">
            <h3 className="client-portal-contact-label">Phone</h3>
            <ul className="client-portal-contact-list">
              {portal.ownerPhones.map((p, i) => (
                <li key={i}>
                  <a href={`tel:${String(p).replace(/\s/g, '')}`}>{p}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {hasEmails ? (
          <div className="client-portal-contact-block">
            <h3 className="client-portal-contact-label">Email</h3>
            <ul className="client-portal-contact-list">
              {portal.ownerEmails.map((e, i) => (
                <li key={i}>
                  <a href={`mailto:${e}`}>{e}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!hasPhones && !hasEmails ? (
          <p className="client-portal-empty">Contact details will appear here when added by Pixdot.</p>
        ) : null}
      </section>
    </div>
  )

  const socialBlock = (
    <div className="client-portal-card client-portal-card--flush client-portal-card--social-wrap">
      <h2 className="client-portal-section-title">Social media</h2>
      {hasSocial ? (
        <ul className="client-portal-social-grid">
          {portal.socialLinks.map((link, i) => {
            const Icon = pickSocialIcon(link.url, link.label)
            return (
              <li key={i}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="client-portal-social-tile">
                  <span className="client-portal-social-tile-icon" aria-hidden>
                    <Icon />
                  </span>
                  <span className="client-portal-social-tile-label">{link.label}</span>
                  {link.handle ? (
                    <span className="client-portal-social-tile-handle">{link.handle}</span>
                  ) : (
                    <span className="client-portal-social-tile-url">{link.url}</span>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="client-portal-empty">Social links will appear here when shared with Pixdot.</p>
      )}
    </div>
  )

  const serviceFocusBlock =
    focusedService ? (
      <div className="client-portal-main-stack">
        <section className="client-portal-card client-portal-card--flush client-portal-card--service-focus">
          <p className="client-portal-kicker client-portal-kicker--in-card">Your service</p>
          <h2 className="client-portal-service-focus-title">{focusedService.name}</h2>
          <p className="client-portal-service-focus-tag">{focusedService.tagline}</p>
          <p className="client-portal-detail-notes">
            Pixdot runs this line of work for {client.name}. Scope, calendar posts, and billing for everything
            together are summarized under <strong>Services &amp; details</strong> in the sidebar.
          </p>
          <button
            type="button"
            className="client-portal-inline-link"
            onClick={() => setActiveView('details')}
          >
            Open full services &amp; details →
          </button>
        </section>
      </div>
    ) : null

  function navBtn(id, label) {
    const isActive = activeView === id
    return (
      <button
        type="button"
        className={`client-portal-nav-btn ${isActive ? 'is-active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => setActiveView(id)}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="client-portal client-portal--v2">
      <header className="client-portal-hero">
        <div className="client-portal-hero-main">
          <div className="client-portal-brand">
            {portal?.logoUrl ? (
              <img src={portal.logoUrl} alt="" className="client-portal-logo" width={56} height={56} />
            ) : (
              <div className="client-portal-logo-fallback" aria-hidden="true">
                {client.initials}
              </div>
            )}
            <div className="client-portal-brand-text">
              <p className="client-portal-kicker">Your workspace</p>
              <h1 className="client-portal-title">{client.name}</h1>
              <p className="client-portal-work-line">{workLine}</p>
              {portal?.companyTagline ? <p className="client-portal-tagline">{portal.companyTagline}</p> : null}
            </div>
          </div>
        </div>
        <div className="client-portal-hero-actions">
          <button type="button" className="px-btn px-btn--outline px-btn--sm" onClick={onMoreServices}>
            More services
          </button>
          <button type="button" className="px-btn px-btn--outline px-btn--sm" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="client-portal-shell">
        <nav className="client-portal-sidebar" aria-label="Workspace sections">
          <p className="client-portal-nav-heading">Menu</p>
          <ul className="client-portal-nav-list">
            <li>{navBtn('calendar', 'Calendar')}</li>
            <li>{navBtn('details', 'Services & details')}</li>
            <li>{navBtn('social', 'Social media')}</li>
          </ul>
          {chosenServices.length > 0 ? (
            <>
              <p className="client-portal-nav-heading">Your chosen services</p>
              <ul className="client-portal-nav-list">
                {chosenServices.map((s) => (
                  <li key={s.id}>{navBtn(`service:${s.id}`, s.name)}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="client-portal-nav-empty">
              No services are linked to this account yet. Pixdot adds only what you signed up for — check back after
              confirmation.
            </p>
          )}
        </nav>

        <main className="client-portal-main" aria-live="polite">
          {activeView === 'calendar' && calendarBlock}
          {activeView === 'details' && detailsBlock}
          {activeView === 'social' && socialBlock}
          {activeView.startsWith('service:') && (focusedService ? serviceFocusBlock : detailsBlock)}
        </main>
      </div>
    </div>
  )
}
