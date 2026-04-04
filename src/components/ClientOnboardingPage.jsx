import { useState } from 'react'
import { SERVICES } from '../data/services.js'

/**
 * New client: no `clientId` yet — Pixdot links the account from the admin side after email confirmation.
 */
export function ClientOnboardingPage({ user, onLogout, onExploreServices }) {
  const [picked, setPicked] = useState(() => new Set())

  function toggle(id) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="client-onboarding">
      <header className="client-onboarding-top">
        <div className="client-onboarding-brand">
          <p className="client-onboarding-kicker">Pixdot</p>
          <h1 className="client-onboarding-title">Welcome, {user?.username ?? 'there'}</h1>
          <p className="client-onboarding-lead">
            Your account is active. Pixdot will send a confirmation email and connect your company workspace from
            our side — then you&apos;ll see your calendar and project details here.
          </p>
        </div>
        <div className="client-onboarding-top-actions">
          <button type="button" className="px-btn px-btn--outline px-btn--sm" onClick={onExploreServices}>
            More services
          </button>
          <button type="button" className="px-btn px-btn--outline px-btn--sm" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <section className="client-onboarding-card" aria-labelledby="co-interest">
        <h2 id="co-interest" className="client-onboarding-section-title">
          What are you interested in?
        </h2>
        <p className="client-onboarding-muted">
          Optional — tap services you care about so we can follow up. This does not book work yet.
        </p>
        <ul className="client-onboarding-service-grid">
          {SERVICES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`client-onboarding-service-chip ${picked.has(s.id) ? 'is-active' : ''}`}
                onClick={() => toggle(s.id)}
              >
                <span className="client-onboarding-service-name">{s.name}</span>
                <span className="client-onboarding-service-tag">{s.tagline}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="client-onboarding-foot">
        Questions? Reply to the confirmation email from Pixdot or contact your project lead.
      </p>
    </div>
  )
}
