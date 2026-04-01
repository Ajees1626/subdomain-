/**
 * Quantity with − / + controls. Values clamped to [min, max].
 */
export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  className = '',
  disabled = false,
  inputClassName = '',
}) {
  const n = Math.max(min, Math.min(max, Number(value) || 0))

  function commit(next) {
    const v = Math.max(min, Math.min(max, next))
    onChange(v)
  }

  return (
    <div className={`qty-stepper ${className}`.trim()}>
      <button
        type="button"
        className="qty-stepper__btn"
        aria-label="Decrease quantity"
        disabled={disabled || n <= min}
        onClick={() => commit(n - step)}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className={`qty-stepper__input ${inputClassName}`.trim()}
        disabled={disabled}
        value={n === 0 ? '' : String(n)}
        onChange={(e) => {
          const t = e.target.value.trim()
          if (t === '') {
            onChange(0)
            return
          }
          const parsed = parseInt(t, 10)
          if (!Number.isNaN(parsed)) commit(parsed)
        }}
      />
      <button
        type="button"
        className="qty-stepper__btn"
        aria-label="Increase quantity"
        disabled={disabled || n >= max}
        onClick={() => commit(n + step)}
      >
        +
      </button>
    </div>
  )
}
