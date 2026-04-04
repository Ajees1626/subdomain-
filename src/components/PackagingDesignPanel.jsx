import { useMemo, useState, useRef, useEffect } from 'react'
import {
  PACKAGING_CUSTOM_KEYS,
  PACKAGING_PACKAGES,
  computeMultiPackagingWithCustom,
  computePackagingPriceDual,
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
  /** Any subset of master / mono / family — order fixed for totals & email */
  const [selectedPkgIds, setSelectedPkgIds] = useState(() => [])
  const [packState, setPackState] = useState(() => initialPackState())
  const [customQty, setCustomQty] = useState(() => initialPackagingCustomQuantities())
  const [company, setCompany] = useState(emptyCompany())
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentVia, setSentVia] = useState(null)
  const [doneWhatsapp, setDoneWhatsapp] = useState(null)

  const combined = useMemo(
    () => computeMultiPackagingWithCustom(packState, selectedPkgIds, customQty),
    [packState, selectedPkgIds, customQty],
  )

  function togglePackageIncluded(id) {
    setSelectedPkgIds((prev) => {
      const set = new Set(prev)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return PACKAGING_PACKAGES.map((p) => p.id).filter((pid) => set.has(pid))
    })
  }

  function resetFlow() {
    setStep('pick')
    setSelectedPkgIds([])
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
    if (selectedPkgIds.length === 0) {
      window.alert('Choose at least one package: Master, Mono, and/or Family — you can select any combination.')
      return
    }
    for (const id of selectedPkgIds) {
      const pkg = PACKAGING_PACKAGES.find((p) => p.id === id)
      const d = computePackagingPriceDual(pkg, packState[id])
      if (!pkg || d.total <= 0) {
        window.alert(
          'For each included package, tick Include on at least one tier (A or B), then set design counts and/or extra rounds.',
        )
        return
      }
    }
    setStep('company')
  }

  function buildMailBodyPlain() {
    const lines = [
      'Pixdot — Packaging Design booking',
      combined.packagingLines.length
        ? `Packages selected (${combined.packagingLines.length}):`
        : '',
      ...combined.packagingLines.flatMap((row) => {
        const bits = [`  · ${row.name}:`]
        if (row.countA > 0) {
          bits.push(
            `    Tier A designs: ${row.countA} × ${formatMoney(row.unitA)} (bundle) = ${formatMoney(row.lineA)}`,
          )
        }
        if (row.countB > 0) {
          bits.push(
            `    Tier B designs: ${row.countB} × ${formatMoney(row.unitB)} (bundle) = ${formatMoney(row.lineB)}`,
          )
        }
        if (row.extraOptionsA > 0) {
          bits.push(
            `    Tier A extra rounds: ${row.extraOptionsA} × ${formatMoney(row.extraOptionPrice)} = ${formatMoney(row.extraLineA)}`,
          )
        }
        if (row.extraOptionsB > 0) {
          bits.push(
            `    Tier B extra rounds: ${row.extraOptionsB} × ${formatMoney(row.extraOptionPrice)} = ${formatMoney(row.extraLineB)}`,
          )
        }
        bits.push(`    Subtotal: ${formatMoney(row.total)}`)
        return bits
      }),
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
      <div className="dm-panel dm-panel--bc-pick dm-panel--pkg-pick" {...servicePanelProps(SID)}>
        <header className="dm-head">
          <h2 className="dm-title">Packaging Design</h2>
          <p className="dm-lead">
            Include a package, then tick Include on each tier you want. Design count × that tier’s bundle price (e.g. 2 × ₹6,999). Extra rounds are per tier. Add-ons are in
            the table below.
          </p>
        </header>

        <div className="bc-pick-main">
          <div className="pkg-stack">
            {PACKAGING_PACKAGES.map((p) => (
              <PackagingCard
                key={p.id}
                pkg={p}
                countA={packState[p.id].countA}
                countB={packState[p.id].countB}
                extraOptionsA={packState[p.id].extraOptionsA ?? 0}
                extraOptionsB={packState[p.id].extraOptionsB ?? 0}
                includeA={packState[p.id].includeA ?? false}
                includeB={packState[p.id].includeB ?? false}
                included={selectedPkgIds.includes(p.id)}
                onToggleIncluded={() => togglePackageIncluded(p.id)}
                onIncludeAChange={(includeA) =>
                  updatePack(p.id, includeA ? { includeA: true } : { includeA: false, countA: 0, extraOptionsA: 0 })
                }
                onIncludeBChange={(includeB) =>
                  updatePack(p.id, includeB ? { includeB: true } : { includeB: false, countB: 0, extraOptionsB: 0 })
                }
                onCountAChange={(countA) => updatePack(p.id, { countA })}
                onCountBChange={(countB) => updatePack(p.id, { countB })}
                onExtraAChange={(extraOptionsA) => updatePack(p.id, { extraOptionsA })}
                onExtraBChange={(extraOptionsB) => updatePack(p.id, { extraOptionsB })}
              />
            ))}
          </div>

          <section className="dm-custom" aria-labelledby="pkg-custom-heading" style={{ marginTop: '1.5rem' }}>
            <h3 id="pkg-custom-heading" className="dm-custom-title">
              Customised packaging add-ons
            </h3>
            <p className="dm-custom-hint">
              Optional extras for mockups, dielines, samples, and rush — all packaging-related. Quantities add on top of your selected package(s).
            </p>

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

  if (step === 'company' && selectedPkgIds.length > 0) {
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

  if (step === 'review' && selectedPkgIds.length > 0) {
    const multi = computeMultiPackagingWithCustom(packState, selectedPkgIds, customQty)
    return (
      <div className="dm-panel dm-panel--form" {...servicePanelProps(SID)}>
        <button type="button" className="dm-back" onClick={() => setStep('agreement')}>
          ← Back
        </button>
        <h2 className="dm-title">Review</h2>
        <div className="dm-review-card">
          <h3 className="dm-review-h">Packaging</h3>
          <ul className="dm-review-list" style={{ margin: '0.35rem 0 0.65rem', paddingLeft: '1.1rem' }}>
            {multi.packagingLines.map((row) => (
              <li key={row.id}>
                <strong>{row.name}</strong>
                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem', fontWeight: 500 }}>
                  {row.countA > 0 && (
                    <li>
                      Tier A designs: {row.countA} × {formatMoney(row.unitA)} (bundle) = {formatMoney(row.lineA)}
                    </li>
                  )}
                  {row.countB > 0 && (
                    <li>
                      Tier B designs: {row.countB} × {formatMoney(row.unitB)} (bundle) = {formatMoney(row.lineB)}
                    </li>
                  )}
                  {row.extraOptionsA > 0 && (
                    <li>
                      Tier A extra rounds: {row.extraOptionsA} × {formatMoney(row.extraOptionPrice)} ={' '}
                      {formatMoney(row.extraLineA)}
                    </li>
                  )}
                  {row.extraOptionsB > 0 && (
                    <li>
                      Tier B extra rounds: {row.extraOptionsB} × {formatMoney(row.extraOptionPrice)} ={' '}
                      {formatMoney(row.extraLineB)}
                    </li>
                  )}
                </ul>
                <span className="dm-review-desc">Subtotal {formatMoney(row.total)}</span>
              </li>
            ))}
          </ul>
          {multi.custom.total > 0 && (
            <>
              <p className="dm-review-h" style={{ marginTop: '0.75rem' }}>
                Customised packaging add-ons
              </p>
              <ul className="dm-review-list">
                {multi.custom.breakdown.map((b) => (
                  <li key={b.label}>
                    {b.label}: {b.qty} × {formatMoney(b.unit)} = {formatMoney(b.line)}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="dm-review-total">Total {formatMoney(multi.total)}</p>
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
  countA,
  countB,
  extraOptionsA,
  extraOptionsB,
  includeA,
  includeB,
  included,
  onToggleIncluded,
  onIncludeAChange,
  onIncludeBChange,
  onCountAChange,
  onCountBChange,
  onExtraAChange,
  onExtraBChange,
}) {
  const [tierFocus, setTierFocus] = useState(null)
  const colARef = useRef(null)
  const colBRef = useRef(null)

  useEffect(() => {
    if (!tierFocus) return
    const t = window.setTimeout(() => setTierFocus(null), 2200)
    return () => window.clearTimeout(t)
  }, [tierFocus])

  function focusCount(which) {
    setTierFocus(which)
    const el = which === 'a' ? colARef.current : colBRef.current
    el?.querySelector?.('input, button')?.focus?.()
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }

  const tiersLocked = !included
  const colADisabled = tiersLocked || !includeA
  const colBDisabled = tiersLocked || !includeB

  return (
    <article className={`pkg-block ${included ? 'pkg-block--included' : ''}`}>
      <div className="pkg-block__row pkg-block__row--head">
        <label className="pkg-block__include">
          <input type="checkbox" checked={included} onChange={onToggleIncluded} />
          <span>Include</span>
        </label>
        <div className="pkg-block__title-wrap">
          <h3 className="pkg-block__title">{pkg.name}</h3>
          <p className="pkg-block__blurb">{pkg.blurb}</p>
        </div>
      </div>

      <div
        className={`pkg-block__row pkg-block__row--tier-cols${tiersLocked ? ' pkg-block__row--tier-cols-locked' : ''}`}
        role="group"
        aria-label={`${pkg.name} Tier A and Tier B`}
      >
        <div
          ref={colARef}
          className={`pkg-tier-column ${tierFocus === 'a' ? 'pkg-tier-column--focus' : ''} ${colADisabled ? 'pkg-tier-column--muted' : ''}`}
          onClick={() => !colADisabled && focusCount('a')}
        >
          <div className="pkg-tier-column__top">
            <div className="pkg-tier-column__price" onClick={() => !colADisabled && focusCount('a')}>
              <span className="pkg-tier-tile__label">Tier A bundle</span>
              <span className="pkg-tier-column__amt">{formatMoney(pkg.tierA)}</span>
            </div>
            <label className="pkg-tier-include" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={includeA}
                disabled={tiersLocked}
                onChange={(e) => onIncludeAChange(e.target.checked)}
              />
              <span>Include</span>
            </label>
          </div>
          <div className="pkg-tier-column__controls" onClick={(e) => e.stopPropagation()}>
            <span className="pkg-count-cell__label">Design count</span>
            <QtyStepper
              className="qty-stepper--pkg"
              value={countA}
              onChange={onCountAChange}
              min={0}
              max={99}
              disabled={colADisabled}
            />
            <span className="pkg-count-cell__label">Extra design rounds · {formatMoney(pkg.extraOptionPrice)} each</span>
            <QtyStepper
              className="qty-stepper--pkg"
              value={extraOptionsA}
              onChange={onExtraAChange}
              min={0}
              max={99}
              disabled={colADisabled}
            />
          </div>
        </div>
        <div
          ref={colBRef}
          className={`pkg-tier-column ${tierFocus === 'b' ? 'pkg-tier-column--focus' : ''} ${colBDisabled ? 'pkg-tier-column--muted' : ''}`}
          onClick={() => !colBDisabled && focusCount('b')}
        >
          <div className="pkg-tier-column__top">
            <div className="pkg-tier-column__price" onClick={() => !colBDisabled && focusCount('b')}>
              <span className="pkg-tier-tile__label">Tier B bundle</span>
              <span className="pkg-tier-column__amt">{formatMoney(pkg.tierB)}</span>
            </div>
            <label className="pkg-tier-include" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={includeB}
                disabled={tiersLocked}
                onChange={(e) => onIncludeBChange(e.target.checked)}
              />
              <span>Include</span>
            </label>
          </div>
          <div className="pkg-tier-column__controls" onClick={(e) => e.stopPropagation()}>
            <span className="pkg-count-cell__label">Design count</span>
            <QtyStepper
              className="qty-stepper--pkg"
              value={countB}
              onChange={onCountBChange}
              min={0}
              max={99}
              disabled={colBDisabled}
            />
            <span className="pkg-count-cell__label">Extra design rounds · {formatMoney(pkg.extraOptionPrice)} each</span>
            <QtyStepper
              className="qty-stepper--pkg"
              value={extraOptionsB}
              onChange={onExtraBChange}
              min={0}
              max={99}
              disabled={colBDisabled}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
