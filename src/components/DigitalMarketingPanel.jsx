import { useMemo, useState } from 'react'
import {
  DM_PLAN_A,
  DM_PLAN_B,
  DM_PAGE_HANDLING,
  DM_CUSTOM_KEYS,
  computeCustomTotal,
  initialCustomQuantities,
} from '../data/digitalMarketing.js'
import { CONTACT_EMAIL } from '../data/contact.js'
import { servicePanelProps } from '../data/serviceThemes.js'
import { QtyStepper } from './QtyStepper.jsx'
import { formatMoney } from '../utils/money.js'

const SID = 'digital-marketing'

const emptyCompany = () => ({
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
})

export function DigitalMarketingPanel() {
  const [step, setStep] = useState('pick')
  const [bookingKind, setBookingKind] = useState(null)
  /** 'plan-a' | 'plan-b' | 'page-handling' | 'custom' */
  const [fixedPlanId, setFixedPlanId] = useState(null)
  const [contentMode, setContentMode] = useState('with')
  const [customQty, setCustomQty] = useState(() => initialCustomQuantities())
  const [company, setCompany] = useState(emptyCompany)
  const [agreed, setAgreed] = useState(false)

  const customCalc = useMemo(
    () => computeCustomTotal(customQty, contentMode),
    [customQty, contentMode],
  )

  function resetFlow() {
    setStep('pick')
    setBookingKind(null)
    setFixedPlanId(null)
    setContentMode('with')
    setCustomQty(initialCustomQuantities())
    setCompany(emptyCompany())
    setAgreed(false)
  }

  function startFixed(planId) {
    setBookingKind('fixed')
    setFixedPlanId(planId)
    setStep('company')
  }

  function startCustom() {
    const { total } = computeCustomTotal(customQty, contentMode)
    if (total <= 0) {
      window.alert('Choose at least one item with quantity greater than 0 for a customised plan.')
      return
    }
    setBookingKind('custom')
    setStep('company')
  }

  const fixedPlan = useMemo(() => {
    if (fixedPlanId === 'plan-a') return DM_PLAN_A
    if (fixedPlanId === 'plan-b') return DM_PLAN_B
    if (fixedPlanId === 'page-handling') return DM_PAGE_HANDLING
    return null
  }, [fixedPlanId])

  const summaryLines = useMemo(() => {
    if (bookingKind === 'fixed' && fixedPlan) {
      if (fixedPlan.lines) {
        return fixedPlan.lines.map((l) => ({ ...l, sub: null }))
      }
      return [{ label: fixedPlan.description || fixedPlan.name, qty: 1, sub: formatMoney(fixedPlan.price) }]
    }
    if (bookingKind === 'custom') {
      return customCalc.breakdown.map((b) => ({
        label: b.label,
        qty: b.qty,
        sub: `${formatMoney(b.unit)} × ${b.qty} = ${formatMoney(b.line)}`,
      }))
    }
    return []
  }, [bookingKind, fixedPlan, customCalc.breakdown])

  const grandTotal = useMemo(() => {
    if (bookingKind === 'fixed' && fixedPlan) return fixedPlan.price
    if (bookingKind === 'custom') return customCalc.total
    return 0
  }, [bookingKind, fixedPlan, customCalc.total])

  function buildMailBody() {
    const basis =
      bookingKind === 'custom'
        ? contentMode === 'with'
          ? 'Pricing basis: With content'
          : 'Pricing basis: Without content'
        : fixedPlanId === 'page-handling'
          ? 'Page handling — client-provided creative & reels'
          : 'Package: With content (fixed plan)'

    const lines = [
      'Pixdot — Digital Marketing booking',
      '',
      `Plan: ${bookingKind === 'fixed' ? fixedPlan?.name : 'Customised plan'}`,
      `Total: ${formatMoney(grandTotal)}`,
      basis,
      '',
      '— Summary —',
      ...summaryLines.map((l) =>
        l.sub ? `${l.label}: ${l.qty} (${l.sub})` : `${l.label}: ${l.qty}`,
      ),
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
    const subject = encodeURIComponent(`Pixdot Digital Marketing — ${company.companyName || 'Booking'}`)
    const body = buildMailBody()
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setStep('done')
  }

  if (step === 'pick') {
    return (
      <div className="dm-panel" {...servicePanelProps(SID)}>
        <header className="dm-head">
          <h2 className="dm-title">Digital Marketing</h2>
          <p className="dm-lead">Pick a plan below, or build a customised package. Fixed plans continue to company details, agreement, and confirmation.</p>
        </header>

        <div className="dm-plan-row">
          <button type="button" className="dm-card dm-card--plan" onClick={() => startFixed('plan-a')}>
            <span className="dm-card-kicker">With content</span>
            <span className="dm-card-name">{DM_PLAN_A.name}</span>
            <span className="dm-card-price">{formatMoney(DM_PLAN_A.price)}</span>
            <ul className="dm-mini-list">
              {DM_PLAN_A.lines.map((l) => (
                <li key={l.label}>
                  {l.label} — {l.qty}
                </li>
              ))}
            </ul>
            <span className="dm-card-cta">Continue →</span>
          </button>

          <button type="button" className="dm-card dm-card--plan" onClick={() => startFixed('plan-b')}>
            <span className="dm-card-kicker">With content</span>
            <span className="dm-card-name">{DM_PLAN_B.name}</span>
            <span className="dm-card-price">{formatMoney(DM_PLAN_B.price)}</span>
            <ul className="dm-mini-list">
              {DM_PLAN_B.lines.map((l) => (
                <li key={l.label}>
                  {l.label} — {l.qty}
                </li>
              ))}
            </ul>
            <span className="dm-card-cta">Continue →</span>
          </button>

          <button type="button" className="dm-card dm-card--plan" onClick={() => startFixed('page-handling')}>
            <span className="dm-card-kicker">{DM_PAGE_HANDLING.subtitle}</span>
            <span className="dm-card-name">{DM_PAGE_HANDLING.name}</span>
            <span className="dm-card-price">{formatMoney(DM_PAGE_HANDLING.price)}</span>
            <p className="dm-card-desc">{DM_PAGE_HANDLING.description}</p>
            <span className="dm-card-cta">Continue →</span>
          </button>
        </div>

        <section className="dm-custom" aria-labelledby="custom-heading">
          <h3 id="custom-heading" className="dm-custom-title">
            Customised plan
          </h3>
          <p className="dm-custom-hint">Choose with content or without content, set quantities — total updates live. Then continue to company details and agreement.</p>

          <div className="dm-toggle" role="group" aria-label="Content pricing">
            <button
              type="button"
              className={contentMode === 'with' ? 'is-on' : ''}
              onClick={() => setContentMode('with')}
            >
              With content
            </button>
            <button
              type="button"
              className={contentMode === 'without' ? 'is-on' : ''}
              onClick={() => setContentMode('without')}
            >
              Without content
            </button>
          </div>

          <div className="dm-table-wrap">
            <table className="dm-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>With content</th>
                  <th>Without content</th>
                  <th>Qty</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {DM_CUSTOM_KEYS.map((row) => {
                  const qty = Math.max(0, Number(customQty[row.key]) || 0)
                  const unit = contentMode === 'with' ? row.withContent : row.withoutContent
                  const line = qty * unit
                  return (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td>{formatMoney(row.withContent)}</td>
                      <td>{formatMoney(row.withoutContent)}</td>
                      <td>
                        <QtyStepper
                          className="qty-stepper--table"
                          value={customQty[row.key]}
                          onChange={(next) =>
                            setCustomQty((m) => ({
                              ...m,
                              [row.key]: next,
                            }))
                          }
                          min={0}
                        />
                      </td>
                      <td className="dm-line-amt">{qty ? formatMoney(line) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="dm-custom-footer">
            <div className="dm-total">
              <span>Estimated total</span>
              <strong>{formatMoney(customCalc.total)}</strong>
            </div>
            <button type="button" className="dm-btn dm-btn--primary" onClick={startCustom}>
              Continue with customised plan
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (step === 'company') {
    return (
      <div className="dm-panel dm-panel--form" {...servicePanelProps(SID)}>
        <button type="button" className="dm-back" onClick={() => setStep('pick')}>
          ← Back to plans
        </button>
        <h2 className="dm-title">Company details</h2>
        <p className="dm-lead">We use this for your agreement and confirmation.</p>

        <div className="dm-form-grid">
          <label className="dm-field">
            <span>Company name *</span>
            <input
              value={company.companyName}
              onChange={(e) => setCompany((c) => ({ ...c, companyName: e.target.value }))}
              required
              autoComplete="organization"
            />
          </label>
          <label className="dm-field">
            <span>Contact name *</span>
            <input
              value={company.contactName}
              onChange={(e) => setCompany((c) => ({ ...c, contactName: e.target.value }))}
              required
              autoComplete="name"
            />
          </label>
          <label className="dm-field">
            <span>Email *</span>
            <input
              type="email"
              value={company.email}
              onChange={(e) => setCompany((c) => ({ ...c, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </label>
          <label className="dm-field">
            <span>Phone *</span>
            <input
              type="tel"
              value={company.phone}
              onChange={(e) => setCompany((c) => ({ ...c, phone: e.target.value }))}
              required
              autoComplete="tel"
            />
          </label>
          <label className="dm-field dm-field--full">
            <span>Notes (optional)</span>
            <textarea
              rows={3}
              value={company.notes}
              onChange={(e) => setCompany((c) => ({ ...c, notes: e.target.value }))}
            />
          </label>
        </div>

        <div className="dm-actions">
          <button
            type="button"
            className="dm-btn dm-btn--primary"
            disabled={!company.companyName.trim() || !company.contactName.trim() || !company.email.trim() || !company.phone.trim()}
            onClick={() => setStep('agreement')}
          >
            Next: Agreement
          </button>
        </div>
      </div>
    )
  }

  if (step === 'agreement') {
    return (
      <div className="dm-panel dm-panel--form" {...servicePanelProps(SID)}>
        <button type="button" className="dm-back" onClick={() => setStep('company')}>
          ← Back
        </button>
        <h2 className="dm-title">Agreement</h2>
        <div className="dm-legal">
          <p>
            By proceeding you confirm that the selected Digital Marketing package, deliverables, and pricing shown in the next step are acceptable. Pixdot will
            share a formal statement of work or contract where applicable. Timelines and creative rounds follow project kickoff.
          </p>
        </div>
        <label className="dm-check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>I agree to proceed with this booking summary.</span>
        </label>
        <div className="dm-actions">
          <button type="button" className="dm-btn dm-btn--primary" disabled={!agreed} onClick={() => setStep('review')}>
            Review booking
          </button>
        </div>
      </div>
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
          <h3 className="dm-review-h">Plan</h3>
          {bookingKind === 'fixed' && fixedPlan && (
            <>
              <p className="dm-review-strong">{fixedPlan.name}</p>
              {fixedPlan.lines && (
                <ul className="dm-review-list">
                  {fixedPlan.lines.map((l) => (
                    <li key={l.label}>
                      {l.label}: {l.qty}
                    </li>
                  ))}
                </ul>
              )}
              {fixedPlan.description && !fixedPlan.lines && <p className="dm-review-desc">{fixedPlan.description}</p>}
              <p className="dm-review-total">Total {formatMoney(fixedPlan.price)}</p>
            </>
          )}
          {bookingKind === 'custom' && (
            <>
              <p className="dm-review-strong">Customised ({contentMode === 'with' ? 'with' : 'without'} content)</p>
              <ul className="dm-review-list">
                {customCalc.breakdown.map((b) => (
                  <li key={b.label}>
                    {b.label}: {b.qty} × {formatMoney(b.unit)} = {formatMoney(b.line)}
                  </li>
                ))}
              </ul>
              <p className="dm-review-total">Total {formatMoney(customCalc.total)}</p>
            </>
          )}
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
        <p className="dm-mail-hint">Confirm opens your email app with a pre-filled message. Edit CONTACT_EMAIL in contact.js for your inbox.</p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="dm-panel dm-panel--done" {...servicePanelProps(SID)}>
        <h2 className="dm-title">Thank you</h2>
        <p className="dm-lead">Your booking summary was prepared. If your mail app opened, send the email to complete the request.</p>
        <button type="button" className="dm-btn dm-btn--primary" onClick={resetFlow}>
          Start new booking
        </button>
      </div>
    )
  }

  return null
}
