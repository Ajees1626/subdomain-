import { useMemo, useState } from 'react'
import { WEB_TIERS, WEB_ADDONS } from '../data/websiteDevelopment.js'
import { BOOKING_REVIEW_HINT } from '../data/contact.js'
import { submitBookingRequest } from '../utils/submitBooking.js'
import { servicePanelProps } from '../data/serviceThemes.js'
import { AgreementBlock, CompanyForm, DoneBlock } from './BookingFlow.jsx'
import { QtyStepper } from './QtyStepper.jsx'
import { formatMoney, formatRange } from '../utils/money.js'

const SID = 'website'

const emptyCompany = () => ({
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
})

export function WebsiteDevelopmentPanel() {
  const [step, setStep] = useState('pick')
  const [tierId, setTierId] = useState('basic')
  const [addons, setAddons] = useState({
    extraPage: 0,
    payment: 0,
    admin: 0,
    hosting: 0,
  })
  const [company, setCompany] = useState(emptyCompany())
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentVia, setSentVia] = useState(null)
  const [doneWhatsapp, setDoneWhatsapp] = useState(null)

  const tier = useMemo(() => WEB_TIERS.find((t) => t.id === tierId) ?? WEB_TIERS[0], [tierId])

  const addonTotal = useMemo(() => {
    let s = 0
    s += addons.extraPage * 1999
    s += addons.payment * 4999
    s += addons.admin * 7999
    s += addons.hosting * 2999
    return s
  }, [addons])

  const estimateMin = useMemo(() => (tier.min ?? 0) + addonTotal, [tier, addonTotal])

  function resetFlow() {
    setStep('pick')
    setTierId('basic')
    setAddons({ extraPage: 0, payment: 0, admin: 0, hosting: 0 })
    setCompany(emptyCompany())
    setAgreed(false)
    setSentVia(null)
    setDoneWhatsapp(null)
  }

  function buildMailBodyPlain() {
    const lines = [
      'Pixdot — Website Development booking',
      `Tier: ${tier.name} (${formatRange(tier.min, tier.max)})`,
      `Add-ons total: ${formatMoney(addonTotal)}`,
      `Estimated from: ${formatMoney(estimateMin)} (tier minimum + add-ons; final within tier range + scope)`,
      '',
      '— Add-ons —',
      addons.extraPage ? `Extra pages: ${addons.extraPage}` : '',
      addons.payment ? 'Payment gateway' : '',
      addons.admin ? 'Admin panel' : '',
      addons.hosting ? 'Hosting setup' : '',
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
      const subject = `Pixdot Website — ${company.companyName || 'Booking'}`
      const r = await submitBookingRequest({
        subject,
        plainBody: buildMailBodyPlain(),
        replyEmail: company.email,
        replyName: company.contactName,
        serviceName: 'Website Development',
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
      <div className="dm-panel" {...servicePanelProps(SID)}>
        <header className="dm-head">
          <h2 className="dm-title">Website Development</h2>
          <p className="dm-lead">Pick a tier (price range), add optional line items — estimate uses tier minimum + add-ons.</p>
        </header>

        <div className="dm-plan-row">
          {WEB_TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`dm-card dm-card--plan ${tierId === t.id ? 'dm-card--selected' : ''}`}
              onClick={() => setTierId(t.id)}
            >
              <span className="dm-card-name">{t.name}</span>
              <span className="dm-card-price">{formatRange(t.min, t.max)}</span>
              <ul className="dm-mini-list">
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <section className="dm-custom" style={{ marginTop: '1.5rem' }}>
          <h3 className="dm-custom-title">Add-ons</h3>
          <div className="dm-form-grid">
            <label className="dm-field">
              <span>Extra pages (× {formatMoney(1999)})</span>
              <QtyStepper value={addons.extraPage} onChange={(n) => setAddons((a) => ({ ...a, extraPage: n }))} min={0} />
            </label>
            <label className="dm-check" style={{ alignSelf: 'end' }}>
              <input
                type="checkbox"
                checked={addons.payment > 0}
                onChange={(e) => setAddons((a) => ({ ...a, payment: e.target.checked ? 1 : 0 }))}
              />
              <span>Payment gateway {formatMoney(4999)}</span>
            </label>
            <label className="dm-check" style={{ alignSelf: 'end' }}>
              <input
                type="checkbox"
                checked={addons.admin > 0}
                onChange={(e) => setAddons((a) => ({ ...a, admin: e.target.checked ? 1 : 0 }))}
              />
              <span>Admin panel {formatMoney(7999)}</span>
            </label>
            <label className="dm-check" style={{ alignSelf: 'end' }}>
              <input
                type="checkbox"
                checked={addons.hosting > 0}
                onChange={(e) => setAddons((a) => ({ ...a, hosting: e.target.checked ? 1 : 0 }))}
              />
              <span>Hosting setup {formatMoney(2999)}</span>
            </label>
          </div>
          <div className="dm-custom-footer">
            <div className="dm-total">
              <span>Estimated from (min tier + add-ons)</span>
              <strong>{formatMoney(estimateMin)}</strong>
            </div>
            <button type="button" className="dm-btn dm-btn--primary" onClick={() => setStep('company')}>
              Continue to booking
            </button>
          </div>
        </section>
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
        backLabel="← Back to tiers"
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
          <h3 className="dm-review-h">Website</h3>
          <p className="dm-review-strong">{tier.name}</p>
          <p className="dm-review-desc">Range {formatRange(tier.min, tier.max)}</p>
          <p className="dm-review-desc">Add-ons {formatMoney(addonTotal)} · Est. from {formatMoney(estimateMin)}</p>
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
        <p className="dm-mail-hint">
          {BOOKING_REVIEW_HINT} Final quote may vary within the tier range.
        </p>
      </div>
    )
  }

  if (step === 'done') {
    return <DoneBlock onReset={resetFlow} serviceId={SID} sentVia={sentVia} whatsapp={doneWhatsapp} />
  }

  return null
}
