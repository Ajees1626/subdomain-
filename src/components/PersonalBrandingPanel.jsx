import { useMemo, useState } from 'react'
import { PB_PLAN_A, PB_PLAN_B } from '../data/personalBranding.js'
import { CONTACT_EMAIL } from '../data/contact.js'
import { servicePanelProps } from '../data/serviceThemes.js'
import { AgreementBlock, CompanyForm, DoneBlock } from './BookingFlow.jsx'
import { formatMoney } from '../utils/money.js'

const SID = 'personal-branding'

const emptyCompany = () => ({
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
})

export function PersonalBrandingPanel() {
  const [step, setStep] = useState('pick')
  const [planId, setPlanId] = useState(null)
  const [company, setCompany] = useState(emptyCompany())
  const [agreed, setAgreed] = useState(false)

  const plan = useMemo(() => {
    if (planId === 'a') return PB_PLAN_A
    if (planId === 'b') return PB_PLAN_B
    return null
  }, [planId])

  function resetFlow() {
    setStep('pick')
    setPlanId(null)
    setCompany(emptyCompany())
    setAgreed(false)
  }

  function startPlan(id) {
    setPlanId(id)
    setStep('company')
  }

  function mailBody() {
    const lines = [
      'Pixdot — Personal Branding booking',
      plan ? `Plan: ${plan.name}` : '',
      plan ? `Total: ${formatMoney(plan.price)}` : '',
      '',
      plan?.lines?.map((l) => `${l.label}: ${l.qty}`).join('\n') ?? '',
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
    const subject = encodeURIComponent(`Pixdot Personal Branding — ${company.companyName || 'Booking'}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${mailBody()}`
    setStep('done')
  }

  if (step === 'pick') {
    return (
      <div className="dm-panel" {...servicePanelProps(SID)}>
        <header className="dm-head">
          <h2 className="dm-title">Personal Branding</h2>
          <p className="dm-lead">Choose a plan. Reels include shoot &amp; edit; posters include content.</p>
        </header>
        <div className="dm-plan-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <button type="button" className="dm-card dm-card--plan" onClick={() => startPlan('a')}>
            <span className="dm-card-kicker">Plan A</span>
            <span className="dm-card-price">{formatMoney(PB_PLAN_A.price)}</span>
            <ul className="dm-mini-list">
              {PB_PLAN_A.lines.map((l) => (
                <li key={l.label}>
                  {l.label} — {l.qty}
                </li>
              ))}
            </ul>
            <span className="dm-card-cta">Continue →</span>
          </button>
          <button type="button" className="dm-card dm-card--plan" onClick={() => startPlan('b')}>
            <span className="dm-card-kicker">Plan B</span>
            <span className="dm-card-price">{formatMoney(PB_PLAN_B.price)}</span>
            <ul className="dm-mini-list">
              {PB_PLAN_B.lines.map((l) => (
                <li key={l.label}>
                  {l.label} — {l.qty}
                </li>
              ))}
            </ul>
            <span className="dm-card-cta">Continue →</span>
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
        onBack={() => {
          setPlanId(null)
          setStep('pick')
        }}
        onNext={() => setStep('agreement')}
        backLabel="← Back to plans"
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

  if (step === 'review' && plan) {
    return (
      <div className="dm-panel dm-panel--form" {...servicePanelProps(SID)}>
        <button type="button" className="dm-back" onClick={() => setStep('agreement')}>
          ← Back
        </button>
        <h2 className="dm-title">Review</h2>
        <div className="dm-review-card">
          <h3 className="dm-review-h">Plan</h3>
          <p className="dm-review-strong">{plan.name}</p>
          <ul className="dm-review-list">
            {plan.lines.map((l) => (
              <li key={l.label}>
                {l.label}: {l.qty}
              </li>
            ))}
          </ul>
          <p className="dm-review-total">Total {formatMoney(plan.price)}</p>
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
