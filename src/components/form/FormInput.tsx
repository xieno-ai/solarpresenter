export interface FormInputProps {
  label: string;
  unit?: string;        // e.g. "kW", "$/kWh", "%"
  error?: string;       // If set: red border + message below
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  readOnly?: boolean;   // For computed fields like annualElectricityCost
  hint?: string;        // Optional helper text below label
}

export function FormInput({
  label,
  unit,
  error,
  value,
  onChange,
  onBlur,
  placeholder,
  readOnly = false,
  hint,
}: FormInputProps) {
  const inputBaseClasses =
    'w-full bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-neutral-100 font-[family-name:var(--font-mono)] placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-colors';

  const inputStateClasses = readOnly
    ? 'border-neutral-800 bg-neutral-950 text-neutral-400 cursor-default'
    : error
      ? 'border-red-500/60 focus:ring-red-500/40'
      : 'border-neutral-700 focus:ring-amber-400/40';

  const unitPaddingClass = unit ? 'pr-12' : '';

  return (
    <div className="space-y-1">
      <label className="text-xs font-[family-name:var(--font-mono)] text-neutral-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${inputBaseClasses} ${inputStateClasses} ${unitPaddingClass}`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-[family-name:var(--font-mono)]">
            {unit}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-neutral-600 mt-1">{hint}</p>
      )}
    </div>
  );
}
