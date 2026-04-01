import { useMemo, useState } from 'react'
import { PACKAGING_PACKAGES, computePackagingPrice } from '../data/packagingDesign.js'
import { CONTACT_EMAIL } from '../data/contact.js'
import { servicePanelProps } from '../data/serviceThemes.js'
import { AgreementBlock, CompanyForm, DoneBlock } from './BookingFlow.jsx'
import { QtyStepper } from './QtyStepper.jsx'
import { formatMoney } from '../utils/money.js'

const SID = 'packaging'

const emptyCompany = () => ({
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
})

export function PackagingDesignPanel() {
  const [step, setStep] = useState('pick')
  const [pkgId, setPkgId] = useState(null)
  const [tier, setTier] = useState('a')
  const [extraOptions, setExtraOptions] = useState(0)
  const [company, setCompany] = useState(emptyCompany())
  const [agreed, setAgreed] = useState(false)

  const pkg = useMemo(() => PACKAGING_PACKAGES.find((p) => p.id === pkgId) ?? null, [pkgId])
  const price = useMemo(() => computePackagingPrice(pkg, tier, extraOptions), [pkg, tier, extraOptions])

  function resetFlow() {
    setStep('pick')
    setPkgId(null)
    setTier('a')
    setExtraOptions(0)
    setCompany(emptyCompany())
    setAgreed(false)
  }

  function startBooking(id) {
    setPkgId(id)
    setTier('a')
    setExtraOptions(0)
    setStep('company')
  }

  function mailBody() {
    const lines = [
      'Pixdot — Packaging Design booking',
      pkg ? `Package: ${pkg.name}` : '',
      `Tier: ${tier === 'a' ? 'Lower' : 'Higher'} (${formatMoney(tier === 'a' ? pkg.tierA : pkg.tierB)} base)`,
      extraOptions > 0 ? `Extra options (beyond 3 included): ${extraOptions} × ${formatMoney(pkg.extraOptionPrice)}` : '',
      `Total: ${formatMoney(price.total)}`,
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
    const subject = encodeURIComponent(`Pixdot Packaging — ${company.companyName || 'Booking'}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${mailBody()}`
    setStep('done')
  }

  if (step === 'pick') {
    return (
      <div className="dm-panel" {...servicePanelProps(SID)}>
        <header className="dm-head">
          <h2 className="dm-title">Packaging Design</h2>
          <p className="dm-lead">
            Each package includes 3 design options. Extra options are {formatMoney(2999)} each. Pick tier (A/B), add extras, then continue.
          </p>
        </header>

        <div className="dm-plan-row">
          {PACKAGING_PACKAGES.map((p) => (
            <PackagingCard key={p.id} pkg={p} onBook={() => startBooking(p.id)} />
          ))}
        </div>
      </div>
    )
  }

  if (step === 'company' && pkg) {
    const packProps = servicePanelProps(SID)
    return (
      <div>
        <div
          className="dm-panel"
          data-service={packProps['data-service']}
          style={{ marginBottom: '1rem', ...packProps.style }}
        >
          <button type="button" className="dm-back" onClick={() => setStep('pick')}>
            ← Back to packages
          </button>
          <h2 className="dm-title">{pkg.name}</h2>
          <p className="dm-lead">3 options included per design. Extra options beyond that: {formatMoney(pkg.extraOptionPrice)} each.</p>
          <div className="dm-toggle" role="group" aria-label="Tier">
            <button type="button" className={tier === 'a' ? 'is-on' : ''} onClick={() => setTier('a')}>
              Tier A {formatMoney(pkg.tierA)}
            </button>
            <button type="button" className={tier === 'b' ? 'is-on' : ''} onClick={() => setTier('b')}>
              Tier B {formatMoney(pkg.tierB)}
            </button>
          </div>
          <label className="dm-field" style={{ marginTop: '1rem' }}>
            <span>Extra options (count beyond 3 included)</span>
            <QtyStepper value={extraOptions} onChange={setExtraOptions} min={0} />
          </label>
          <div className="dm-total" style={{ marginTop: '1rem' }}>
            <span>Subtotal</span>
            <strong>{formatMoney(price.total)}</strong>
          </div>
        </div>
        <CompanyForm
          company={company}
          setCompany={setCompany}
          onBack={() => {
            setPkgId(null)
            setStep('pick')
          }}
          onNext={() => setStep('agreement')}
          backLabel="← Change package"
          serviceId={SID}
        />
      </div>
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

  if (step === 'review' && pkg) {
    return (
      <div className="dm-panel dm-panel--form" {...servicePanelProps(SID)}>
        <button type="button" className="dm-back" onClick={() => setStep('agreement')}>
          ← Back
        </button>
        <h2 className="dm-title">Review</h2>
        <div className="dm-review-card">
          <h3 className="dm-review-h">Packaging</h3>
          <p className="dm-review-strong">{pkg.name}</p>
          <p className="dm-review-desc">
            Tier {tier === 'a' ? 'A' : 'B'} · Base {formatMoney(tier === 'a' ? pkg.tierA : pkg.tierB)}
            {extraOptions > 0 && (
              <>
                <br />
                Extra options: {extraOptions} × {formatMoney(pkg.extraOptionPrice)} = {formatMoney(price.extraLine)}
              </>
            )}
          </p>
          <p className="dm-review-total">Total {formatMoney(price.total)}</p>
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

function PackagingCard({ pkg, onBook }) {
  return (
    <div className="dm-card dm-card--plan" style={{ cursor: 'default' }}>
      <span className="dm-card-name">{pkg.name}</span>
      <p className="dm-card-desc" style={{ margin: '0.5rem 0' }}>
        Tier A {formatMoney(pkg.tierA)} · Tier B {formatMoney(pkg.tierB)}
      </p>
      <p className="dm-mini-list" style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem', fontSize: '0.8rem' }}>
        3 options included · Extra {formatMoney(pkg.extraOptionPrice)} / option
      </p>
      <button type="button" className="dm-btn dm-btn--primary" style={{ width: '100%', marginTop: 'auto' }} onClick={onBook}>
        Configure & book
      </button>
    </div>
  )
}
