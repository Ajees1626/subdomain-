import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppDevelopmentPanel } from './components/AppDevelopmentPanel.jsx'
import { AuthPage } from './components/AuthPage.jsx'
import { BrandCreativePanel } from './components/BrandCreativePanel.jsx'
import { DigitalMarketingPanel } from './components/DigitalMarketingPanel.jsx'
import { PackagingDesignPanel } from './components/PackagingDesignPanel.jsx'
import { PersonalBrandingPanel } from './components/PersonalBrandingPanel.jsx'
import { ClientOnboardingPage } from './components/ClientOnboardingPage.jsx'
import { ClientPortalPage } from './components/ClientPortalPage.jsx'
import { EmployeePage } from './components/EmployeePage.jsx'
import { ClientWorkspacePage } from './components/ClientWorkspacePage.jsx'
import { ServicesLanding } from './components/ServicesLanding.jsx'
import { WebsiteDevelopmentPanel } from './components/WebsiteDevelopmentPanel.jsx'
import { SERVICES, getDetailPlaceholder } from './data/services.js'
import { servicePanelProps } from './data/serviceThemes.js'
import { fetchMe, getStoredToken, setStoredToken } from './utils/authApi.js'

const PANELS = {
  'brand-creative': BrandCreativePanel,
  packaging: PackagingDesignPanel,
  'digital-marketing': DigitalMarketingPanel,
  'personal-branding': PersonalBrandingPanel,
  website: WebsiteDevelopmentPanel,
  app: AppDevelopmentPanel,
}

const MQ_TABLET = '(min-width: 768px)'

const slideEase = [0.22, 1, 0.36, 1]
const slideDur = 0.34

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)
  const [showLanding, setShowLanding] = useState(true)
  const [serviceId, setServiceId] = useState(SERVICES[0].id)
  const [optionId, setOptionId] = useState(SERVICES[0].options[0].id)
  const [navOpen, setNavOpen] = useState(false)
  const [clientWorkspaceId, setClientWorkspaceId] = useState(null)
  /** Client-only: browse full Pixdot services (landing + shell) without admin client grid. */
  const [clientBrowseServices, setClientBrowseServices] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!getStoredToken()) {
        setAuthReady(true)
        return
      }
      try {
        const data = await fetchMe()
        if (!cancelled) setUser(data.user)
      } catch {
        setStoredToken(null)
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function logout() {
    setStoredToken(null)
    setUser(null)
    setShowLanding(true)
    setClientWorkspaceId(null)
    setClientBrowseServices(false)
  }

  function openClientServicesBrowse() {
    setClientBrowseServices(true)
    setShowLanding(true)
    setClientWorkspaceId(null)
  }

  const service = useMemo(() => SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0], [serviceId])

  const option = useMemo(() => {
    const o = service.options.find((x) => x.id === optionId)
    return o ?? service.options[0]
  }, [service, optionId])

  const closeNav = useCallback(() => setNavOpen(false), [])

  useEffect(() => {
    const mq = window.matchMedia(MQ_TABLET)
    function onChange() {
      if (mq.matches) setNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!navOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  function onPickService(id) {
    setServiceId(id)
    const next = SERVICES.find((s) => s.id === id)
    if (next?.options[0]) setOptionId(next.options[0].id)
    closeNav()
  }

  function onLandingPickService(id) {
    setClientWorkspaceId(null)
    onPickService(id)
    setShowLanding(false)
  }

  function goToAllServices() {
    setClientWorkspaceId(null)
    setShowLanding(true)
    closeNav()
  }

  function onPickOption(id) {
    setOptionId(id)
    closeNav()
  }

  const detail = getDetailPlaceholder(service, option)
  const Panel = PANELS[serviceId]

  if (!authReady) {
    return (
      <div className="auth-boot">
        <p className="auth-boot__text">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPage onAuthed={setUser} />
  }

  if (user.role === 'employee') {
    return (
      <div className="app-root app-root--employee">
        <EmployeePage user={user} onLogout={logout} />
      </div>
    )
  }

  /** Match backend resolveRole: not admin/employee, but client role or linked workspace. */
  const isClient =
    user.role !== 'admin' &&
    user.role !== 'employee' &&
    (user.role === 'client' || Boolean(user.clientId))
  const clientHasWorkspace = Boolean(user.clientId)

  if (isClient && !clientBrowseServices) {
    if (!clientHasWorkspace) {
      return (
        <div className="app-root app-root--client-portal">
          <ClientOnboardingPage user={user} onLogout={logout} onExploreServices={openClientServicesBrowse} />
        </div>
      )
    }
    return (
      <div className="app-root app-root--client-portal">
        <ClientPortalPage user={user} onLogout={logout} onMoreServices={openClientServicesBrowse} />
      </div>
    )
  }

  return (
    <div
      className={`app-root${isClient && clientBrowseServices ? ' app-root--client-browse' : ''}`}
    >
      {isClient && clientBrowseServices ? (
        <div className="client-browse-strip">
          <button
            type="button"
            className="px-btn px-btn--outline px-btn--sm"
            onClick={() => {
              setClientBrowseServices(false)
              setShowLanding(true)
              setClientWorkspaceId(null)
            }}
          >
            ← My dashboard
          </button>
          <button type="button" className="px-btn px-btn--outline px-btn--sm" onClick={logout}>
            Log out
          </button>
        </div>
      ) : null}
      <AnimatePresence mode="sync">
        {clientWorkspaceId ? (
          <motion.div
            key="client-workspace"
            className="app-stage__layer app-stage__layer--client-workspace"
            initial={{ x: '28%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '28%', opacity: 0 }}
            transition={{ duration: slideDur, ease: slideEase }}
          >
            <ClientWorkspacePage
              initialClientId={clientWorkspaceId}
              onBack={() => setClientWorkspaceId(null)}
              onLogout={logout}
            />
          </motion.div>
        ) : showLanding ? (
          <motion.div
            key="landing"
            className="app-stage__layer app-stage__layer--landing"
            initial={{ x: '-28%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-28%', opacity: 0 }}
            transition={{ duration: slideDur, ease: slideEase }}
          >
            <ServicesLanding
              onSelectService={onLandingPickService}
              onOpenClientWorkspace={(id) => setClientWorkspaceId(id)}
              onLogout={logout}
              hideAdminWorkspace={isClient}
            />
          </motion.div>
        ) : (
          <motion.div
            key="shell"
            className={`app-stage__layer app-stage__layer--shell shell ${navOpen ? 'shell--nav-open' : ''}`}
            {...servicePanelProps(serviceId)}
            initial={{ x: '28%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '28%', opacity: 0 }}
            transition={{ duration: slideDur, ease: slideEase }}
          >
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setNavOpen((o) => !o)}
          aria-expanded={navOpen}
          aria-controls="app-sidebar"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="mobile-menu-icon" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
        <button
          type="button"
          className="mobile-back-services px-btn px-btn--outline px-btn--sm"
          onClick={goToAllServices}
        >
          All services
        </button>
        <div className="mobile-topbar-text">
          <span className="mobile-topbar-brand">Pixdot</span>
          <span className="mobile-topbar-service">{service.name}</span>
        </div>
        <button type="button" className="mobile-logout px-btn px-btn--outline px-btn--sm" onClick={logout}>
          Log out
        </button>
      </header>

      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close menu"
        tabIndex={navOpen ? 0 : -1}
        onClick={closeNav}
      />

      <aside className="sidebar" id="app-sidebar" aria-label="Services and options">
        <div className="sidebar-brand">
          <p className="sidebar-kicker">Pixdot</p>
          <h1 className="sidebar-title">Services</h1>
          <p className="sidebar-user" title={user.email}>
            {user.username}
          </p>
          <button
            type="button"
            className="sidebar-logout px-btn px-btn--outline px-btn--block px-btn--sm"
            onClick={logout}
          >
            Log out
          </button>
        </div>

        <nav className="sidebar-block">
          <p className="sidebar-label">Choose service</p>
          <ul className="service-list">
            {SERVICES.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`service-btn ${serviceId === s.id ? 'is-active' : ''}`}
                  onClick={() => onPickService(s.id)}
                >
                  <span className="service-btn-name">{s.name}</span>
                  <span className="service-btn-tag">{s.tagline}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-mid-logout">
          <button
            type="button"
            className="sidebar-logout px-btn px-btn--outline px-btn--block px-btn--sm"
            onClick={logout}
          >
            Log out
          </button>
        </div>

        <nav className="sidebar-block sidebar-block--options">
          <p className="sidebar-label">Options</p>
          <ul className="option-list">
            {service.options.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className={`option-btn ${optionId === o.id ? 'is-active' : ''}`}
                  onClick={() => onPickOption(o.id)}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="detail" aria-label="Details">
        {Panel ? (
          <>
            <div className="detail-all-services-wrap">
              <button
                type="button"
                className="detail-all-services px-btn px-btn--outline px-btn--sm"
                onClick={goToAllServices}
              >
                ← All services
              </button>
            </div>
            <Panel />
          </>
        ) : (
          <>
            <header className="detail-header">
              <p className="detail-breadcrumb">
                {service.name}
                <span className="detail-sep" aria-hidden>
                  /
                </span>
                {option.label}
              </p>
              <h2 className="detail-title">{detail.title}</h2>
            </header>
            <div className="detail-body">
              {detail.lines.map((line, i) => (
                <p key={i} className="detail-line">
                  {line}
                </p>
              ))}
            </div>
          </>
        )}
      </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
