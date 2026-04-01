import { useMemo, useState } from 'react'
import { APP_TIERS, APP_ADDONS } from '../data/appDevelopment.js'
import { CONTACT_EMAIL } from '../data/contact.js'
import { servicePanelProps } from '../data/serviceThemes.js'
import { AgreementBlock, CompanyForm, DoneBlock } from './BookingFlow.jsx'
import { QtyStepper } from './QtyStepper.jsx'
import { formatMoney, formatRange } from '../utils/money.js'

const SID = 'app'

const emptyCompany = () => ({
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
})

export function AppDevelopmentPanel() {
  const [step, setStep] = useState('pick')
  const [tierId, setTierId] = useState('basic')
  const [addons, setAddons] = useState({
    playStore: 0,
    maintenance: 0,
    api: 0,
  })
  const [company, setCompany] = useState(emptyCompany())
  const [agreed, setAgreed] = useState(false)

  const tier = useMemo(() => APP_TIERS.find((t) => t.id === tierId) ?? APP_TIERS[0], [tierId])

  const addonTotal = useMemo(() => {
    let s = 0
    s += addons.playStore * 4999
    s += addons.maintenance * 5000
    s += addons.api * 7999
    return s
  }, [addons])

  const estimateMin = useMemo(() => (tier.min ?? 0) + addonTotal, [tier, addonTotal])

  function resetFlow() {
    setStep('pick')
    setTierId('basic')
    setAddons({ playStore: 0, maintenance: 0, api: 0 })
    setCompany(emptyCompany())
    setAgreed(false)
  }

  function mailBody() {
    const lines = [
      'Pixdot — App Development booking',
      `Tier: ${tier.name} (${formatRange(tier.min, tier.max)})`,
      `Add-ons total: ${formatMoney(addonTotal)}`,
      `Estimated from: ${formatMoney(estimateMin)} (tier minimum + add-ons)`,
      '',
      '— Add-ons —',
      addons.playStore ? `Play Store upload × ${addons.playStore}` : '',
      addons.maintenance ? `Maintenance months × ${addons.maintenance}` : '',
      addons.api ? `API integration × ${addons.api}` : '',
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
    const subject = encodeURIComponent(`Pixdot App — ${company.companyName || 'Booking'}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${mailBody()}`
    setStep('done')
  }

  if (step === 'pick') {
    return (
      <div className="dm-panel" {...servicePanelProps(SID)}>
        <header className="dm-head">
          <h2 className="dm-title">App Development</h2>
          <p className="dm-lead">Select tier and add-ons. Estimate = tier minimum + selected add-ons.</p>
        </header>

        <div className="dm-plan-row">
          {APP_TIERS.map((t) => (
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
              <span>Play Store upload (× {formatMoney(4999)})</span>
              <QtyStepper value={addons.playStore} onChange={(n) => setAddons((a) => ({ ...a, playStore: n }))} min={0} />
            </label>
            <label className="dm-field">
              <span>App maintenance months (× {formatMoney(5000)} / mo)</span>
              <QtyStepper
                value={addons.maintenance}
                onChange={(n) => setAddons((a) => ({ ...a, maintenance: n }))}
                min={0}
              />
            </label>
            <label className="dm-field">
              <span>API integration (× {formatMoney(7999)})</span>
              <QtyStepper value={addons.api} onChange={(n) => setAddons((a) => ({ ...a, api: n }))} min={0} />
            </label>
          </div>
          <div className="dm-custom-footer">
            <div className="dm-total">
              <span>Estimated from</span>
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
          <h3 className="dm-review-h">App</h3>
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
