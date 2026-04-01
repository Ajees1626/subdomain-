import { servicePanelProps } from '../data/serviceThemes.js'

export function emptyCompany() {
  return {
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    notes: '',
  }
}

export function CompanyForm({ company, setCompany, onBack, onNext, backLabel = '← Back', serviceId }) {
  const ok =
    company.companyName.trim() &&
    company.contactName.trim() &&
    company.email.trim() &&
    company.phone.trim()

  return (
    <div className="dm-panel dm-panel--form" {...servicePanelProps(serviceId)}>
      <button type="button" className="dm-back" onClick={onBack}>
        {backLabel}
      </button>
      <h2 className="dm-title">Company details</h2>
      <p className="dm-lead">We use this for your agreement and confirmation.</p>

      <div className="dm-form-grid">
        <label className="dm-field">
          <span>Company name *</span>
          <input
            value={company.companyName}
            onChange={(e) => setCompany((c) => ({ ...c, companyName: e.target.value }))}
            autoComplete="organization"
          />
        </label>
        <label className="dm-field">
          <span>Contact name *</span>
          <input
            value={company.contactName}
            onChange={(e) => setCompany((c) => ({ ...c, contactName: e.target.value }))}
            autoComplete="name"
          />
        </label>
        <label className="dm-field">
          <span>Email *</span>
          <input
            type="email"
            value={company.email}
            onChange={(e) => setCompany((c) => ({ ...c, email: e.target.value }))}
            autoComplete="email"
          />
        </label>
        <label className="dm-field">
          <span>Phone *</span>
          <input
            type="tel"
            value={company.phone}
            onChange={(e) => setCompany((c) => ({ ...c, phone: e.target.value }))}
            autoComplete="tel"
          />
        </label>
        <label className="dm-field dm-field--full">
          <span>Notes (optional)</span>
          <textarea rows={3} value={company.notes} onChange={(e) => setCompany((c) => ({ ...c, notes: e.target.value }))} />
        </label>
      </div>

      <div className="dm-actions">
        <button type="button" className="dm-btn dm-btn--primary" disabled={!ok} onClick={onNext}>
          Next: Agreement
        </button>
      </div>
    </div>
  )
}

export function AgreementBlock({ agreed, setAgreed, onBack, onNext, serviceId }) {
  return (
    <div className="dm-panel dm-panel--form" {...servicePanelProps(serviceId)}>
      <button type="button" className="dm-back" onClick={onBack}>
        ← Back
      </button>
      <h2 className="dm-title">Agreement</h2>
      <div className="dm-legal">
        <p>
          By proceeding you confirm that the selected package, deliverables, and pricing shown in the next step are acceptable. Pixdot will share a formal
          statement of work or contract where applicable.
        </p>
      </div>
      <label className="dm-check">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>I agree to proceed with this booking summary.</span>
      </label>
      <div className="dm-actions">
        <button type="button" className="dm-btn dm-btn--primary" disabled={!agreed} onClick={onNext}>
          Review booking
        </button>
      </div>
    </div>
  )
}

export function ReviewBlock({ onBack, onConfirm, children, grandTotal, hint, serviceId }) {
  return (
    <div className="dm-panel dm-panel--form" {...servicePanelProps(serviceId)}>
      <button type="button" className="dm-back" onClick={onBack}>
        ← Back
      </button>
      <h2 className="dm-title">Review</h2>
      {children}
      <div className="dm-actions dm-actions--split">
        <button type="button" className="dm-btn" onClick={onBack}>
          Edit
        </button>
        <button type="button" className="dm-btn dm-btn--primary" onClick={onConfirm}>
          Confirm & open email
        </button>
      </div>
      {hint && <p className="dm-mail-hint">{hint}</p>}
    </div>
  )
}

export function DoneBlock({ onReset, serviceId }) {
  return (
    <div className="dm-panel dm-panel--done" {...servicePanelProps(serviceId)}>
      <h2 className="dm-title">Thank you</h2>
      <p className="dm-lead">Your booking summary was prepared. If your mail app opened, send the email to complete the request.</p>
      <button type="button" className="dm-btn dm-btn--primary" onClick={onReset}>
        Start new booking
      </button>
    </div>
  )
}
