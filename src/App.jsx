import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppDevelopmentPanel } from './components/AppDevelopmentPanel.jsx'
import { BrandCreativePanel } from './components/BrandCreativePanel.jsx'
import { DigitalMarketingPanel } from './components/DigitalMarketingPanel.jsx'
import { PackagingDesignPanel } from './components/PackagingDesignPanel.jsx'
import { PersonalBrandingPanel } from './components/PersonalBrandingPanel.jsx'
import { ServicesLanding } from './components/ServicesLanding.jsx'
import { WebsiteDevelopmentPanel } from './components/WebsiteDevelopmentPanel.jsx'
import { SERVICES, getDetailPlaceholder } from './data/services.js'
import { servicePanelProps } from './data/serviceThemes.js'

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
  const [showLanding, setShowLanding] = useState(true)
  const [serviceId, setServiceId] = useState(SERVICES[0].id)
  const [optionId, setOptionId] = useState(SERVICES[0].options[0].id)
  const [navOpen, setNavOpen] = useState(false)

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
    onPickService(id)
    setShowLanding(false)
  }

  function goToAllServices() {
    setShowLanding(true)
    closeNav()
  }

  function onPickOption(id) {
    setOptionId(id)
    closeNav()
  }

  const detail = getDetailPlaceholder(service, option)
  const Panel = PANELS[serviceId]

  return (
    <div className="app-root">
      <AnimatePresence mode="sync">
        {showLanding ? (
          <motion.div
            key="landing"
            className="app-stage__layer app-stage__layer--landing"
            initial={{ x: '-28%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-28%', opacity: 0 }}
            transition={{ duration: slideDur, ease: slideEase }}
          >
            <ServicesLanding onSelectService={onLandingPickService} />
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
        <button type="button" className="mobile-back-services" onClick={goToAllServices}>
          All services
        </button>
        <div className="mobile-topbar-text">
          <span className="mobile-topbar-brand">Pixdot</span>
          <span className="mobile-topbar-service">{service.name}</span>
        </div>
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
          <button type="button" className="sidebar-all-services" onClick={goToAllServices}>
            ← All services
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
          <Panel />
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
