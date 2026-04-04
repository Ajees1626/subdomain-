import { DASHBOARD_CLIENTS } from '../data/clientDashboard.js'

/**
 * Landing-only client cards. Opening a client goes to full page via `onOpenWorkspace` (App).
 */
export function ClientDashboard({ onOpenWorkspace, onLogout }) {
  return (
    <section className="admin-dash" aria-labelledby="admin-dash-title">
      <header className="admin-dash-head">
        <div className="admin-dash-head-row">
          <div className="admin-dash-head-copy">
            <p className="admin-dash-kicker">Admin workspace</p>
            <h2 id="admin-dash-title" className="admin-dash-title">
              Clients
            </h2>
            <p className="admin-dash-lead">
              Open a client for calendar and requirements — same full-page flow as <strong>View more</strong> on a
              service.
            </p>
          </div>
          {onLogout ? (
            <button
              type="button"
              className="admin-dash-logout-corner px-btn px-btn--outline px-btn--sm"
              onClick={onLogout}
            >
              Log out
            </button>
          ) : null}
        </div>
      </header>
      <div className="admin-dash-cards">
        {DASHBOARD_CLIENTS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="admin-dash-card"
            onClick={() => onOpenWorkspace?.(c.id)}
          >
            <div className="admin-dash-card-logo" aria-hidden>
              {c.logoUrl ? (
                <img src={c.logoUrl} alt="" className="admin-dash-card-logo-img" />
              ) : (
                <span className="admin-dash-card-initials">{c.initials}</span>
              )}
            </div>
            <div className="admin-dash-card-body">
              <span className="admin-dash-card-name">{c.name}</span>
              <span className="admin-dash-card-services">{c.servicesSummary}</span>
              <span className="admin-dash-card-hint">Open workspace →</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
