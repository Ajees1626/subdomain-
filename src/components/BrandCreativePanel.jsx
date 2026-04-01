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
  computeBrandTotal,
  initialBrandState,
} from '../data/brandCreative.js'
import { CONTACT_EMAIL } from '../data/contact.js'
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

  const calc = useMemo(() => computeBrandTotal(bc), [bc])

  function resetFlow() {
    setStep('pick')
    setBc(initialBrandState())
    setCompany({ companyName: '', contactName: '', email: '', phone: '', notes: '' })
    setAgreed(false)
  }

  function continueBooking() {
    if (calc.total <= 0) {
      window.alert('Select at least one item with a tier or page count.')
      return
    }
    setStep('company')
  }

  function mailBody() {
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
    return encodeURIComponent(lines.join('\n'))
  }

  function onConfirmSend() {
    const subject = encodeURIComponent(`Pixdot Brand & Creative — ${company.companyName || 'Booking'}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${mailBody()}`
    setStep('done')
  }

  if (step === 'pick') {
    return (
      <div className="dm-panel" {...servicePanelProps(SID)}>
        <header className="dm-head">
          <h2 className="dm-title">Brand & Creative</h2>
          <p className="dm-lead">Choose tiers and quantities. Total updates live. Optional logo add-on applies on top of a selected logo tier.</p>
        </header>

        <div className="bc-box">
          <h3 className="bc-box-title">Logo</h3>
          <TierAB
            label=""
            value={bc.logo.tier}
            onChange={(v) => setBc((s) => ({ ...s, logo: { ...s.logo, tier: v } }))}
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_LOGO.tierA}
            bPrice={BC_LOGO.tierB}
          />
          <label className="bc-check">
            <input
              type="checkbox"
              checked={bc.logo.optional}
              onChange={(e) => setBc((s) => ({ ...s, logo: { ...s.logo, optional: e.target.checked } }))}
            />
            <span>Optional add {formatMoney(BC_LOGO.optionalAdd)}</span>
          </label>
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
            onChange={(v) => setBc((s) => ({ ...s, promoBanner: { ...s.promoBanner, tier: v } }))}
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_PROMO_BANNER.tierA}
            bPrice={BC_PROMO_BANNER.tierB}
          />
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
            onChange={(v) => setBc((s) => ({ ...s, webBanner: { tier: v } }))}
            aLabel="Tier 1"
            bLabel="Tier 2"
            aPrice={BC_WEB_BANNER.tierA}
            bPrice={BC_WEB_BANNER.tierB}
          />
        </div>

        <div className="dm-custom-footer" style={{ marginTop: '1.5rem' }}>
          <div className="dm-total">
            <span>Estimated total</span>
            <strong>{formatMoney(calc.total)}</strong>
          </div>
          <button type="button" className="dm-btn dm-btn--primary" onClick={continueBooking}>
            Continue to booking
          </button>
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
          <button type="button" className="dm-btn dm-btn--primary" onClick={onConfirmSend}>
            Confirm & open email
          </button>
        </div>
        <p className="dm-mail-hint">Edit CONTACT_EMAIL in contact.js for your inbox.</p>
      </div>
    )
  }

  if (step === 'done') {
    return <DoneBlock onReset={resetFlow} serviceId={SID} />
  }

  return null
}
