import { useMemo, useState } from 'react'
import { PB_PLAN_A, PB_PLAN_B } from '../data/personalBranding.js'
import { BOOKING_REVIEW_HINT } from '../data/contact.js'
import { submitBookingRequest } from '../utils/submitBooking.js'
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
  const [sending, setSending] = useState(false)
  const [sentVia, setSentVia] = useState(null)
  const [doneWhatsapp, setDoneWhatsapp] = useState(null)

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
    setSentVia(null)
    setDoneWhatsapp(null)
  }

  function startPlan(id) {
    setPlanId(id)
    setStep('company')
  }

  function buildMailBodyPlain() {
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
    return lines.join('\n')
  }

  async function onConfirmSend() {
    setSending(true)
    try {
      const subject = `Pixdot Personal Branding — ${company.companyName || 'Booking'}`
      const r = await submitBookingRequest({
        subject,
        plainBody: buildMailBodyPlain(),
        replyEmail: company.email,
        replyName: company.contactName,
        serviceName: 'Personal Branding',
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
