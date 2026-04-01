import { useMemo, useState } from 'react'
import {
  BC_LOGO,
  BC_GUIDELINE,
  BC_BUSINESS_CARD,
  BC_BROCHURE,
  BC_MENU,
  BC_TSHIRT,
  BC_LETTER,
  BC_PROMO_BANNER,
  BC_WEB_BANNER,
  BC_CREATIVE,
  BC_AD_CREATIVE,
  computeBrandTotal,
  initialBrandState,
} from '../data/brandCreative.js'
import { BOOKING_REVIEW_HINT } from '../data/contact.js'
import { submitBookingRequest } from '../utils/submitBooking.js'
import { servicePanelProps } from '../data/serviceThemes.js'
import { AgreementBlock, CompanyForm, DoneBlock } from './BookingFlow.jsx'
import { QtyStepper } from './QtyStepper.jsx'
import { formatMoney } from '../utils/money.js'

const SID = 'brand-creative'

function TierAB({ label, value, onChange, aLabel, bLabel, aPrice, bPrice }) {
  return (
    <div className="bc-row">
      <span className="bc-row-label">{label}</span>
      <div className="bc-tier-btns">
        <button type="button" className={value === 'none' ? 'is-on' : ''} onClick={() => onChange('none')}>
          —
        </button>
        <button type="button" className={value === 'a' ? 'is-on' : ''} onClick={() => onChange('a')}>
          {aLabel} {formatMoney(aPrice)}
        </button>
        <button type="button" className={value === 'b' ? 'is-on' : ''} onClick={() => onChange('b')}>
          {bLabel} {formatMoney(bPrice)}
        </button>
      </div>
    </div>
  )
}

export function BrandCreativePanel() {
  const [step, setStep] = useState('pick')
  const [bc, setBc] = useState(() => initialBrandState())
  const [company, setCompany] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentVia, setSentVia] = useState(null)
  const [doneWhatsapp, setDoneWhatsapp] = useState(null)

  const calc = useMemo(() => computeBrandTotal(bc), [bc])

  function resetFlow() {
    setStep('pick')
    setBc(initialBrandState())
    setCompany({ companyName: '', contactName: '', email: '', phone: '', notes: '' })
    setAgreed(false)
    setSentVia(null)
    setDoneWhatsapp(null)
  }

  function continueBooking() {
    if (calc.total <= 0) {
      window.alert('Select at least one item with a tier or page count.')
      return
    }
    setStep('company')
  }

  function buildMailBodyPlain() {
    const lines = [
      'Pixdot — Brand & Creative booking',
      `Total: ${formatMoney(calc.total)}`,
      '',
      '— Line items —',
      ...calc.breakdown.map((b) => `${b.label}: ${b.detail} → ${formatMoney(b.line)}`),
      '',
      '— Company —',
      `Company: ${company.companyName}`,
      `Contact: ${company.contactName}`,
      `Email: ${company.email}`,
      `Phone: ${company.phone}`,
      company.notes ? `Notes: ${company.notes}` : '',
    ].filter(Boolean)
    return lines.join('\n')
  }

  async function onConfirmSend() {
    setSending(true)
    try {
      const subject = `Pixdot Brand & Creative — ${company.companyName || 'Booking'}`
      const r = await submitBookingRequest({
        subject,
        plainBody: buildMailBodyPlain(),
        replyEmail: company.email,
        replyName: company.contactName,
        serviceName: 'Brand & Creative',
        clientPhone: company.phone,
      })
      const wa = r.whatsappToPixdot ? { toPixdot: r.whatsappToPixdot } : null
      if (r.mode === 'mailto' && r.mailtoUrl) {
        window.location.href = r.mailtoUrl
        setSentVia('mailto')
        setDoneWhatsapp(wa)
      } else if (r.success) {
        setSentVia('web3')
        setDoneWhatsapp(wa)
      } else {
        window.alert(r.error || 'Could not send. Try again.')
        return
      }
      setStep('done')
    } finally {
      setSending(false)
    }
  }

  if (step === 'pick') {
    return (
      <div className="dm-panel dm-panel--bc-pick" {...servicePanelProps(SID)}>
        <header className="dm-head">
          <h2 className="dm-title">Brand & Creative</h2>
          <p className="dm-lead">
            Choose tiers and quantities. Total updates live. Use optional add-on count (0 if none) — priced per unit on top of your logo tier.
          </p>
        </header>

        <div className="bc-pick-main">
        <div className="bc-grid">
        <div className="bc-box">
          <h3 className="bc-box-title">Logo</h3>
          <TierAB
            label=""
            value={bc.logo.tier}
            onChange={(v) =>
              setBc((s) => ({
                ...s,
                logo: {
                  ...s.logo,
                  tier: v,
                  qty: v === 'none' ? 1 : s.logo.qty,
                  optionalQty: v === 'none' ? 0 : s.logo.optionalQty,
                },
              }))
            }
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_LOGO.tierA}
            bPrice={BC_LOGO.tierB}
          />
          {(bc.logo.tier === 'a' || bc.logo.tier === 'b') && (
            <div className="bc-row">
              <span className="bc-row-label">Count</span>
              <QtyStepper
                value={bc.logo.qty}
                min={1}
                max={99}
                onChange={(next) =>
                  setBc((s) => ({
                    ...s,
                    logo: { ...s.logo, qty: next },
                  }))
                }
              />
            </div>
          )}
          {(bc.logo.tier === 'a' || bc.logo.tier === 'b') && (
            <div className="bc-row">
              <span className="bc-row-label">Optional add ({formatMoney(BC_LOGO.optionalAdd)} each)</span>
              <QtyStepper
                value={bc.logo.optionalQty}
                min={0}
                max={99}
                onChange={(next) =>
                  setBc((s) => ({
                    ...s,
                    logo: { ...s.logo, optionalQty: next },
                  }))
                }
              />
            </div>
          )}
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Brand guideline</h3>
          <TierAB
            label=""
            value={bc.guideline.tier}
            onChange={(v) => setBc((s) => ({ ...s, guideline: { tier: v } }))}
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_GUIDELINE.tierA}
            bPrice={BC_GUIDELINE.tierB}
          />
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Business card</h3>
          <TierAB
            label=""
            value={bc.businessCard.tier}
            onChange={(v) => setBc((s) => ({ ...s, businessCard: { tier: v } }))}
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_BUSINESS_CARD.tierA}
            bPrice={BC_BUSINESS_CARD.tierB}
          />
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Brochure (per page)</h3>
          <div className="bc-row">
            <span className="bc-row-label">Pages</span>
            <QtyStepper
              value={bc.brochure.pages}
              onChange={(next) =>
                setBc((s) => ({
                  ...s,
                  brochure: { ...s.brochure, pages: next },
                }))
              }
              min={0}
            />
          </div>
          <div className="bc-row">
            <span className="bc-row-label">Rate tier</span>
            <div className="bc-tier-btns">
              <button
                type="button"
                className={bc.brochure.tier === 'low' ? 'is-on' : ''}
                onClick={() => setBc((s) => ({ ...s, brochure: { ...s.brochure, tier: 'low' } }))}
              >
                {formatMoney(BC_BROCHURE.perPageLow)} / page
              </button>
              <button
                type="button"
                className={bc.brochure.tier === 'high' ? 'is-on' : ''}
                onClick={() => setBc((s) => ({ ...s, brochure: { ...s.brochure, tier: 'high' } }))}
              >
                {formatMoney(BC_BROCHURE.perPageHigh)} / page
              </button>
            </div>
          </div>
          <label className="bc-check">
            <input
              type="checkbox"
              checked={bc.brochure.contentAdd}
              onChange={(e) => setBc((s) => ({ ...s, brochure: { ...s.brochure, contentAdd: e.target.checked } }))}
            />
            <span>Content add {formatMoney(BC_BROCHURE.contentAddPerPage)} / page</span>
          </label>
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Menu card (per page)</h3>
          <div className="bc-row">
            <span className="bc-row-label">Pages</span>
            <QtyStepper
              value={bc.menu.pages}
              onChange={(next) =>
                setBc((s) => ({
                  ...s,
                  menu: { ...s.menu, pages: next },
                }))
              }
              min={0}
            />
          </div>
          <div className="bc-row">
            <span className="bc-row-label">Rate</span>
            <div className="bc-tier-btns">
              <button
                type="button"
                className={bc.menu.tier === 'low' ? 'is-on' : ''}
                onClick={() => setBc((s) => ({ ...s, menu: { ...s.menu, tier: 'low' } }))}
              >
                {formatMoney(BC_MENU.perPageLow)} / page
              </button>
              <button
                type="button"
                className={bc.menu.tier === 'high' ? 'is-on' : ''}
                onClick={() => setBc((s) => ({ ...s, menu: { ...s.menu, tier: 'high' } }))}
              >
                {formatMoney(BC_MENU.perPageHigh)} / page
              </button>
            </div>
          </div>
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">T-shirt / bag design</h3>
          <TierAB
            label=""
            value={bc.tshirt.tier}
            onChange={(v) => setBc((s) => ({ ...s, tshirt: { tier: v } }))}
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_TSHIRT.tierA}
            bPrice={BC_TSHIRT.tierB}
          />
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Letter head</h3>
          <TierAB
            label=""
            value={bc.letter.tier}
            onChange={(v) => setBc((s) => ({ ...s, letter: { tier: v } }))}
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_LETTER.tierA}
            bPrice={BC_LETTER.tierB}
          />
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Promotional banner</h3>
          <TierAB
            label=""
            value={bc.promoBanner.tier}
            onChange={(v) =>
              setBc((s) => ({
                ...s,
                promoBanner: { ...s.promoBanner, tier: v, qty: v === 'none' ? 1 : s.promoBanner.qty },
              }))
            }
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_PROMO_BANNER.tierA}
            bPrice={BC_PROMO_BANNER.tierB}
          />
          {(bc.promoBanner.tier === 'a' || bc.promoBanner.tier === 'b') && (
            <div className="bc-row">
              <span className="bc-row-label">Count</span>
              <QtyStepper
                value={bc.promoBanner.qty}
                min={1}
                max={99}
                onChange={(next) =>
                  setBc((s) => ({
                    ...s,
                    promoBanner: { ...s.promoBanner, qty: next },
                  }))
                }
              />
            </div>
          )}
          <label className="bc-check">
            <input
              type="checkbox"
              checked={bc.promoBanner.contentAdd}
              onChange={(e) => setBc((s) => ({ ...s, promoBanner: { ...s.promoBanner, contentAdd: e.target.checked } }))}
            />
            <span>Content add {formatMoney(BC_PROMO_BANNER.contentAdd)}</span>
          </label>
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Website banner</h3>
          <TierAB
            label=""
            value={bc.webBanner.tier}
            onChange={(v) =>
              setBc((s) => ({
                ...s,
                webBanner: { ...s.webBanner, tier: v, qty: v === 'none' ? 1 : s.webBanner.qty },
              }))
            }
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_WEB_BANNER.tierA}
            bPrice={BC_WEB_BANNER.tierB}
          />
          {(bc.webBanner.tier === 'a' || bc.webBanner.tier === 'b') && (
            <div className="bc-row">
              <span className="bc-row-label">Count</span>
              <QtyStepper
                value={bc.webBanner.qty}
                min={1}
                max={99}
                onChange={(next) =>
                  setBc((s) => ({
                    ...s,
                    webBanner: { ...s.webBanner, qty: next },
                  }))
                }
              />
            </div>
          )}
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Creative</h3>
          <div className="bc-row">
            <span className="bc-row-label">Rate</span>
            <div className="bc-tier-btns">
              <button
                type="button"
                className={bc.creative.withContent ? 'is-on' : ''}
                onClick={() => setBc((s) => ({ ...s, creative: { ...s.creative, withContent: true } }))}
              >
                With content {formatMoney(BC_CREATIVE.withContent)}
              </button>
              <button
                type="button"
                className={!bc.creative.withContent ? 'is-on' : ''}
                onClick={() => setBc((s) => ({ ...s, creative: { ...s.creative, withContent: false } }))}
              >
                Without {formatMoney(BC_CREATIVE.withoutContent)}
              </button>
            </div>
          </div>
          <div className="bc-row">
            <span className="bc-row-label">Qty</span>
            <QtyStepper
              value={bc.creative.qty}
              min={0}
              max={99}
              onChange={(next) =>
                setBc((s) => ({
                  ...s,
                  creative: { ...s.creative, qty: next },
                }))
              }
            />
          </div>
        </div>

        <div className="bc-box">
          <h3 className="bc-box-title">Ad creative</h3>
          <div className="bc-row">
            <span className="bc-row-label">Rate</span>
            <div className="bc-tier-btns">
              <button
                type="button"
                className={bc.adCreative.withContent ? 'is-on' : ''}
                onClick={() => setBc((s) => ({ ...s, adCreative: { ...s.adCreative, withContent: true } }))}
              >
                With content {formatMoney(BC_AD_CREATIVE.withContent)}
              </button>
              <button
                type="button"
                className={!bc.adCreative.withContent ? 'is-on' : ''}
                onClick={() => setBc((s) => ({ ...s, adCreative: { ...s.adCreative, withContent: false } }))}
              >
                Without {formatMoney(BC_AD_CREATIVE.withoutContent)}
              </button>
            </div>
          </div>
          <div className="bc-row">
            <span className="bc-row-label">Qty</span>
            <QtyStepper
              value={bc.adCreative.qty}
              min={0}
              max={99}
              onChange={(next) =>
                setBc((s) => ({
                  ...s,
                  adCreative: { ...s.adCreative, qty: next },
                }))
              }
            />
          </div>
        </div>
        </div>
        </div>

        <div className="bc-pick-bar" role="region" aria-label="Quote total">
          <div className="bc-pick-bar-inner dm-custom-footer">
            <div className="dm-total">
              <span>Estimated total</span>
              <strong>{formatMoney(calc.total)}</strong>
            </div>
            <button type="button" className="dm-btn dm-btn--primary" onClick={continueBooking}>
              Continue to booking
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'company') {
    return (
      <CompanyForm
        company={company}
        setCompany={setCompany}
        onBack={() => setStep('pick')}
        onNext={() => setStep('agreement')}
        backLabel="← Back to quote"
        serviceId={SID}
      />
    )
  }

  if (step === 'agreement') {
    return (
      <AgreementBlock
        agreed={agreed}
        setAgreed={setAgreed}
        onBack={() => setStep('company')}
        onNext={() => setStep('review')}
        serviceId={SID}
      />
    )
  }

  if (step === 'review') {
    return (
      <div className="dm-panel dm-panel--form" {...servicePanelProps(SID)}>
        <button type="button" className="dm-back" onClick={() => setStep('agreement')}>
          ← Back
        </button>
        <h2 className="dm-title">Review</h2>
        <div className="dm-review-card">
          <h3 className="dm-review-h">Brand & Creative</h3>
          <ul className="dm-review-list">
            {calc.breakdown.map((b) => (
              <li key={`${b.label}-${b.detail}`}>
                {b.label} — {b.detail} → {formatMoney(b.line)}
              </li>
            ))}
          </ul>
          <p className="dm-review-total">Total {formatMoney(calc.total)}</p>
        </div>
        <div className="dm-review-card">
          <h3 className="dm-review-h">Company</h3>
          <p>
            {company.companyName}
            <br />
            {company.contactName} · {company.email} · {company.phone}
          </p>
          {company.notes && <p className="dm-notes">{company.notes}</p>}
        </div>
        <div className="dm-actions dm-actions--split">
          <button type="button" className="dm-btn" onClick={() => setStep('agreement')}>
            Edit
          </button>
          <button type="button" className="dm-btn dm-btn--primary" disabled={sending} onClick={onConfirmSend}>
            {sending ? 'Sending…' : 'Confirm & send'}
          </button>
        </div>
        <p className="dm-mail-hint">{BOOKING_REVIEW_HINT}</p>
      </div>
    )
  }

  if (step === 'done') {
    return <DoneBlock onReset={resetFlow} serviceId={SID} sentVia={sentVia} whatsapp={doneWhatsapp} />
  }

  return null
}
