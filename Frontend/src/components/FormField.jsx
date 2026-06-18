/* Shared base classes applied via className strings so they work with Tailwind purging */

export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  inputMode,
  pattern,
  maxLength,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-indigo-200/90 flex items-center gap-1">
        {label}
        {required && <span className="text-marigold-500 text-xs leading-none">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-premium"
      />
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  required = false,
  options,
  placeholder,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-indigo-200/90 flex items-center gap-1">
        {label}
        {required && <span className="text-marigold-500 text-xs leading-none">*</span>}
      </label>
      <select
        id={id}
        name={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-premium"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}