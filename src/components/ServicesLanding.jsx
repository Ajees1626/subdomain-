import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaBoxOpen, FaBullhorn, FaCircleUser, FaGlobe, FaMobileScreenButton, FaPalette } from 'react-icons/fa6'
import { HiOutlineArrowNarrowRight } from 'react-icons/hi'
import { SERVICES } from '../data/services.js'
import { SERVICE_THEMES, SERVICE_WATERMARKS, servicePanelProps } from '../data/serviceThemes.js'

const ICONS = {
  'brand-creative': FaPalette,
  packaging: FaBoxOpen,
  'digital-marketing': FaBullhorn,
  'personal-branding': FaCircleUser,
  website: FaGlobe,
  app: FaMobileScreenButton,
}

const spring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.88 }

const footerMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.08 },
}

/**
 * Horizontal expanding accordion (home): pick a service, then open full app shell via CTA.
 */
export function ServicesLanding({ onSelectService }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const activeService = SERVICES[activeIndex] ?? SERVICES[0]

  return (
    <div className="services-landing" {...servicePanelProps(activeService.id)}>
      <header className="services-landing-head">
        <p className="services-landing-kicker">Pixdot</p>
        <h1 className="services-landing-title">Our services</h1>
        <p className="services-landing-lead">
          Tap a column to expand. Use <strong>View more</strong> to open plans and booking.
        </p>
      </header>

      <div className="services-acc-wrap">
        <div className="services-acc" role="list">
          {SERVICES.map((s, i) => {
            const Icon = ICONS[s.id]
            const theme = SERVICE_THEMES[s.id]
            const isActive = activeIndex === i
            const n = String(i + 1).padStart(2, '0')
            const watermarkLabel = SERVICE_WATERMARKS[s.id] ?? 'PIX'

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
                transition={spring}
                onClick={() => setActiveIndex(i)}
              >
                {isActive ? (
                  <motion.span
                    className="services-acc-watermark"
                    aria-hidden
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 0.15, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {watermarkLabel}
                  </motion.span>
                ) : null}

                <div className="services-acc-panel-inner">
                  {!isActive ? (
                    <motion.div
                      className="services-acc-collapsed"
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="services-acc-num" style={{ color: theme.indexColor }}>
                        {n}
                      </span>
                      <span className="services-acc-title-collapsed">{s.name}</span>
                      <span className="services-acc-tag-collapsed">{s.tagline}</span>
                      <span className="services-acc-chev" aria-hidden>
                        →
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="services-acc-expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="services-acc-icon-ring"
                        initial={{ scale: 0.75, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ ...spring, delay: 0.05 }}
                      >
                        {Icon ? <Icon className="services-acc-icon" /> : null}
                      </motion.div>
                      <motion.div className="services-acc-expanded-footer" {...footerMotion}>
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
    </div>
  )
}
