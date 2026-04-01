import { useMemo, useState } from 'react'
import {
  PACKAGING_CUSTOM_KEYS,
  PACKAGING_PACKAGES,
  computePackagingCustomTotal,
  computePackagingWithCustom,
  initialPackagingCustomQuantities,
  initialPackState,
} from '../data/packagingDesign.js'
import { BOOKING_REVIEW_HINT } from '../data/contact.js'
import { servicePanelProps } from '../data/serviceThemes.js'
import { AgreementBlock, CompanyForm, DoneBlock } from './BookingFlow.jsx'
import { QtyStepper } from './QtyStepper.jsx'
import { formatMoney } from '../utils/money.js'
import { submitBookingRequest } from '../utils/submitBooking.js'

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
  const [selectedPkgId, setSelectedPkgId] = useState(null)
  const [packState, setPackState] = useState(() => initialPackState())
  const [customQty, setCustomQty] = useState(() => initialPackagingCustomQuantities())
  const [company, setCompany] = useState(emptyCompany())
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentVia, setSentVia] = useState(null)
  const [doneWhatsapp, setDoneWhatsapp] = useState(null)

  const selectedPkg = useMemo(
    () => PACKAGING_PACKAGES.find((p) => p.id === selectedPkgId) ?? null,
    [selectedPkgId],
  )

  const selection = selectedPkgId ? packState[selectedPkgId] : null

  const combined = useMemo(() => {
    if (!selectedPkg || !selection) {
      const custom = computePackagingCustomTotal(customQty)
      return {
        packaging: { total: 0, base: 0, extraLine: 0, extraCount: 0, pkg: null },
        custom,
        total: custom.total,
      }
    }
    return computePackagingWithCustom(selectedPkg, selection.tier, selection.extraOptions, customQty)
  }, [selectedPkg, selection, customQty])

  function resetFlow() {
    setStep('pick')
    setSelectedPkgId(null)
    setPackState(initialPackState())
    setCustomQty(initialPackagingCustomQuantities())
    setCompany(emptyCompany())
    setAgreed(false)
    setSentVia(null)
    setDoneWhatsapp(null)
  }

  function updatePack(id, patch) {
    setPackState((s) => ({
      ...s,
      [id]: { ...s[id], ...patch },
    }))
  }

  function continueToCompany() {
    if (!selectedPkgId || !selectedPkg) {
      window.alert('Select a package: Master, Mono, or Family design.')
      return
    }
    setStep('company')
  }

  function buildMailBodyPlain() {
    const pkg = selectedPkg
    const ps = selectedPkgId ? packState[selectedPkgId] : null
    const lines = [
      'Pixdot — Packaging Design booking',
      pkg && ps ? `Package: ${pkg.name}` : '',
      pkg && ps
        ? `Tier: ${ps.tier === 'a' ? 'A' : 'B'} (${formatMoney(ps.tier === 'a' ? pkg.tierA : pkg.tierB)} base)`
        : '',
      pkg && ps && ps.extraOptions > 0
        ? `Extra options (beyond 3 included): ${ps.extraOptions} × ${formatMoney(pkg.extraOptionPrice)}`
        : '',
      combined.custom.total > 0 ? `Packaging add-ons subtotal: ${formatMoney(combined.custom.total)}` : '',
      ...combined.custom.breakdown.map(
        (b) => `  · ${b.label}: ${b.qty} × ${formatMoney(b.unit)} = ${formatMoney(b.line)}`,
      ),
      `Total: ${formatMoney(combined.total)}`,
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
      const subject = `Pixdot Packaging — ${company.companyName || 'Booking'}`
      const r = await submitBookingRequest({
        subject,
        plainBody: buildMailBodyPlain(),
        replyEmail: company.email,
        replyName: company.contactName,
        serviceName: 'Packaging Design',
        clientPhone: company.phone,
      })
      if (r.mode === 'mailto' && r.mailtoUrl) {
        window.location.href = r.mailtoUrl
        setSentVia('mailto')
        setDoneWhatsapp(r.whatsappToPixdot ? { toPixdot: r.whatsappToPixdot } : null)
      } else if (r.success) {
        setSentVia('web3')
        setDoneWhatsapp(r.whatsappToPixdot ? { toPixdot: r.whatsappToPixdot } : null)
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
          <h2 className="dm-title">Packaging Design</h2>
          <p className="dm-lead">
            Each package includes 3 design options. Choose tier (A/B) and extra options on each card. Add optional packaging-only add-ons below. Then continue to
            company details.
          </p>
        </header>

        <div className="bc-pick-main">
          <div className="dm-plan-row">
            {PACKAGING_PACKAGES.map((p) => (
              <PackagingCard
                key={p.id}
                pkg={p}
                tier={packState[p.id].tier}
                extraOptions={packState[p.id].extraOptions}
                selected={selectedPkgId === p.id}
                onSelect={() => setSelectedPkgId(p.id)}
                onTierChange={(tier) => updatePack(p.id, { tier })}
                onExtraChange={(extraOptions) => updatePack(p.id, { extraOptions })}
              />
            ))}
          </div>

          <section className="dm-custom" aria-labelledby="pkg-custom-heading" style={{ marginTop: '1.5rem' }}>
            <h3 id="pkg-custom-heading" className="dm-custom-title">
              Customised packaging add-ons
            </h3>
            <p className="dm-custom-hint">Optional extras for mockups, dielines, samples, and rush — all packaging-related. Quantities add to your selected package.</p>

            <div className="dm-table-wrap">
              <table className="dm-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price (₹)</th>
                    <th>Qty</th>
                    <th>Line</th>
                  </tr>
                </thead>
                <tbody>
                  {PACKAGING_CUSTOM_KEYS.map((row) => {
                    const qty = Math.max(0, Number(customQty[row.key]) || 0)
                    const line = qty * row.price
                    return (
                      <tr key={row.key}>
                        <td>{row.label}</td>
                        <td>{formatMoney(row.price)}</td>
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
          </section>
        </div>

        <div className="bc-pick-bar" role="region" aria-label="Quote total">
          <div className="bc-pick-bar-inner dm-custom-footer">
            <div className="dm-total">
              <span>Estimated total</span>
              <strong>{formatMoney(combined.total)}</strong>
            </div>
            <button type="button" className="dm-btn dm-btn--primary" onClick={continueToCompany}>
              Continue to booking
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'company' && selectedPkg && selectedPkgId) {
    return (
      <CompanyForm
        company={company}
        setCompany={setCompany}
        onBack={() => setStep('pick')}
        onNext={() => setStep('agreement')}
        backLabel="← Back to packages"
        serviceId={SID}
      />
    )
  }

  if (step === 'company') {
    return null
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

  if (step === 'review' && selectedPkg && selectedPkgId && selection) {
    const ps = selection
    const pkg = selectedPkg
    const packPart = computePackagingWithCustom(pkg, ps.tier, ps.extraOptions, customQty)
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
            Tier {ps.tier === 'a' ? 'A' : 'B'} · Base {formatMoney(ps.tier === 'a' ? pkg.tierA : pkg.tierB)}
            {ps.extraOptions > 0 && (
              <>
                <br />
                Extra options: {ps.extraOptions} × {formatMoney(pkg.extraOptionPrice)} = {formatMoney(packPart.packaging.extraLine)}
              </>
            )}
          </p>
          {packPart.custom.total > 0 && (
            <>
              <p className="dm-review-h" style={{ marginTop: '0.75rem' }}>
                Customised packaging add-ons
              </p>
              <ul className="dm-review-list">
                {packPart.custom.breakdown.map((b) => (
                  <li key={b.label}>
                    {b.label}: {b.qty} × {formatMoney(b.unit)} = {formatMoney(b.line)}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="dm-review-total">Total {formatMoney(packPart.total)}</p>
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

function PackagingCard({
  pkg,
  tier,
  extraOptions,
  selected,
  onSelect,
  onTierChange,
  onExtraChange,
}) {
  return (
    <div
      className={`dm-card dm-card--plan ${selected ? 'dm-card--selected' : ''}`}
      style={{ cursor: 'default' }}
    >
      <span className="dm-card-name">{pkg.name}</span>
      <p className="dm-card-desc" style={{ margin: '0.5rem 0' }}>
        Tier A {formatMoney(pkg.tierA)} · Tier B {formatMoney(pkg.tierB)}
      </p>
      <p className="dm-mini-list" style={{ listStyle: 'none', padding: 0, margin: '0 0 0.65rem', fontSize: '0.8rem' }}>
        3 options included · Extra {formatMoney(pkg.extraOptionPrice)} / option
      </p>

      <div className="dm-toggle" role="group" aria-label={`${pkg.name} tier`} style={{ width: '100%', marginBottom: '0.65rem' }}>
        <button type="button" className={tier === 'a' ? 'is-on' : ''} onClick={() => onTierChange('a')}>
          Tier A {formatMoney(pkg.tierA)}
        </button>
        <button type="button" className={tier === 'b' ? 'is-on' : ''} onClick={() => onTierChange('b')}>
          Tier B {formatMoney(pkg.tierB)}
        </button>
      </div>

      <label className="dm-field" style={{ marginBottom: '0.75rem', width: '100%' }}>
        <span>Extra options (beyond 3 included)</span>
        <QtyStepper value={extraOptions} onChange={onExtraChange} min={0} />
      </label>

      <button type="button" className="dm-btn dm-btn--primary" style={{ width: '100%', marginTop: 'auto' }} onClick={onSelect}>
        {selected ? 'Selected package' : 'Select this package'}
      </button>
    </div>
  )
}
