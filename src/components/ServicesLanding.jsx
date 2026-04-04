import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FaBoxOpen, FaBullhorn, FaCircleUser, FaGlobe, FaMobileScreenButton, FaPalette } from 'react-icons/fa6'
import { HiOutlineArrowNarrowRight } from 'react-icons/hi'
import { ClientDashboard } from './ClientDashboard.jsx'
import { SERVICES } from '../data/services.js'
import {
  SERVICE_THEMES,
  SERVICE_WATERMARKS,
  SERVICE_COLLAPSED_IMAGES,
  servicePanelProps,
} from '../data/serviceThemes.js'

/** Landing column order (must match product flow: logo → packaging → ads → YouTube → website → app) */
const LANDING_SERVICE_ORDER = [
  'brand-creative',
  'packaging',
  'digital-marketing',
  'personal-branding',
  'website',
  'app',
]

const LANDING_SERVICES = LANDING_SERVICE_ORDER.map((id) => SERVICES.find((s) => s.id === id)).filter(Boolean)

const ICONS = {
  'brand-creative': FaPalette,
  packaging: FaBoxOpen,
  'digital-marketing': FaBullhorn,
  'personal-branding': FaCircleUser,
  website: FaGlobe,
  app: FaMobileScreenButton,
}

/** Tween on flex avoids spring overshoot + fewer layout passes than a bouncy spring */
const panelTransitionSmooth = { type: 'tween', duration: 0.34, ease: [0.25, 0.46, 0.45, 0.94] }

const footerMotion = (shouldReduceMotion) =>
  shouldReduceMotion
    ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: [0.33, 1, 0.68, 1], delay: 0.04 },
      }

/**
 * Horizontal expanding accordion (home): pick a service, then open full app shell via CTA.
 */
export function ServicesLanding({
  onSelectService,
  onOpenClientWorkspace,
  onLogout,
  /** Hide admin client workspace grid (logged-in clients browsing services only). */
  hideAdminWorkspace = false,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  const flexTransition = useMemo(
    () => (shouldReduceMotion ? { duration: 0 } : panelTransitionSmooth),
    [shouldReduceMotion],
  )

  const activeService = LANDING_SERVICES[activeIndex] ?? LANDING_SERVICES[0]

  return (
    <div
      className={`services-landing${hideAdminWorkspace ? ' services-landing--client-browse' : ''}`}
      {...servicePanelProps(activeService.id)}
    >
      {!hideAdminWorkspace ? (
        <ClientDashboard onOpenWorkspace={onOpenClientWorkspace} onLogout={onLogout} />
      ) : null}

      <section className="services-landing-bottom" aria-labelledby="services-landing-services-title">
        <header className="services-landing-head">
          <p className="services-landing-kicker">Pixdot</p>
          <h1 id="services-landing-services-title" className="services-landing-title">
            Our services
          </h1>
          <p className="services-landing-lead">
            Tap a column to expand. Use <strong>View more</strong> to open plans and booking.
          </p>
        </header>

        <div className="services-acc-wrap">
        <div className="services-acc" role="list">
          {LANDING_SERVICES.map((s, i) => {
            const Icon = ICONS[s.id]
            const theme = SERVICE_THEMES[s.id]
            const isActive = activeIndex === i
            const n = String(i + 1).padStart(2, '0')
            const watermarkLabel = SERVICE_WATERMARKS[s.id] ?? 'PIX'
            const wmLong = watermarkLabel.length > 4
            const collapsedImg = SERVICE_COLLAPSED_IMAGES[s.id]

            return (
              <motion.div
                key={s.id}
                role="listitem"
                className={`services-acc-panel ${isActive ? 'is-active' : ''}`}
                style={{ '--acc-gradient': theme.gradient, '--acc-index': theme.indexColor }}
                initial={false}
                animate={{
                  /* Ratios sum in-row: ~50% expanded, rest shared — no min-width overflow */
                  flex: isActive ? 1 : 0.21,
                }}
                transition={flexTransition}
                onClick={() => setActiveIndex(i)}
              >
                <div className="services-acc-panel-inner">
                  {!isActive ? (
                    <motion.div
                      className={`services-acc-collapsed${collapsedImg ? ' services-acc-collapsed--photo' : ''}`}
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                    >
                      {collapsedImg ? (
                        <img
                          className="services-acc-collapsed-bg"
                          src={collapsedImg}
                          alt=""
                          loading={i < 2 ? 'eager' : 'lazy'}
                          decoding="async"
                          sizes="(max-width: 700px) 22vw, 140px"
                        />
                      ) : null}
                      {collapsedImg ? <div className="services-acc-collapsed-top-overlay" aria-hidden /> : null}
                      <div className="services-acc-collapsed-content">
                        <span className="services-acc-num">{n}</span>
                        <span className="services-acc-title-collapsed">{s.name}</span>
                        <span className="services-acc-tag-collapsed">{s.tagline}</span>
                      </div>
                      <div className="services-acc-collapsed-bottom">
                        <button
                          type="button"
                          className="services-acc-collapsed-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectService(s.id)
                          }}
                        >
                          View more
                          <HiOutlineArrowNarrowRight aria-hidden className="services-acc-collapsed-btn-ico" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="services-acc-expanded"
                      initial={shouldReduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
                    >
                      <motion.div
                        className="services-acc-icon-ring"
                        initial={shouldReduceMotion ? false : { scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: 'tween', duration: 0.26, ease: [0.33, 1, 0.68, 1], delay: 0.03 }
                        }
                      >
                        {Icon ? <Icon className="services-acc-icon" /> : null}
                      </motion.div>
                      <motion.span
                        className={`services-acc-watermark${wmLong ? ' services-acc-watermark--long' : ''}`}
                        aria-hidden
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 0.2, y: 0 }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { duration: 0.28, ease: [0.33, 1, 0.68, 1], delay: 0.06 }
                        }
                      >
                        {watermarkLabel}
                      </motion.span>
                      <motion.div className="services-acc-expanded-footer" {...footerMotion(shouldReduceMotion)}>
                        <h2 className="services-acc-expanded-title">{s.name}</h2>
                        <p className="services-acc-expanded-desc">{s.tagline}</p>
                        <button
                          type="button"
                          className="services-acc-btn services-acc-btn--on-gradient"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectService(s.id)
                          }}
                        >
                          View more
                          <HiOutlineArrowNarrowRight aria-hidden className="services-acc-btn-ico" />
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      </section>
    </div>
  )
}
