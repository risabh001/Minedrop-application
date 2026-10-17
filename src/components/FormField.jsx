export default function FormField({ field, value, error, onChange }) {
  const describedBy = error ? `${field.key}-error` : undefined;

  if (field.type === 'checkbox') {
    const checked = value === true;
    return (
      <div>
        <label
          className={`option-row ${checked ? 'option-row-selected' : ''} ${error ? '!border-signal-500' : ''}`}
        >
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 accent-drop-500 shrink-0"
            checked={checked}
            onChange={(e) => onChange(field.key, e.target.checked)}
            aria-describedby={describedBy}
          />
          <span className="text-sm text-ink-100 leading-relaxed">{field.label}</span>
        </label>
        {error && <p id={describedBy} className="field-error">{error}</p>}
      </div>
    );
  }

  if (field.type === 'radio') {
    return (
      <fieldset>
        <legend className="field-label">
          {field.label}
          {field.required && <span className="text-signal-500 ml-1">*</span>}
        </legend>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {field.options.map((opt) => {
            const selected = value === opt;
            return (
              <label key={opt} className={`option-row ${selected ? 'option-row-selected' : ''}`}>
                <input
                  type="radio"
                  name={field.key}
                  className="mt-0.5 w-4 h-4 accent-drop-500 shrink-0"
                  checked={selected}
                  onChange={() => onChange(field.key, opt)}
                />
                <span className="text-sm text-ink-100">{opt}</span>
              </label>
            );
          })}
        </div>
        {error && <p className="field-error">{error}</p>}
      </fieldset>
    );
  }

  if (field.type === 'checkboxGroup') {
    const selected = Array.isArray(value) ? value : [];
    function toggle(opt) {
      const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
      onChange(field.key, next);
    }
    return (
      <fieldset>
        <legend className="field-label">
          {field.label}
          {field.required && <span className="text-signal-500 ml-1">*</span>}
        </legend>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {field.options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label key={opt} className={`option-row ${checked ? 'option-row-selected' : ''}`}>
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-drop-500 shrink-0"
                  checked={checked}
                  onChange={() => toggle(opt)}
                />
                <span className="text-sm text-ink-100">{opt}</span>
              </label>
            );
          })}
        </div>
        {error && <p className="field-error">{error}</p>}
      </fieldset>
    );
  }

  const commonProps = {
    id: field.key,
    name: field.key,
    value: value ?? '',
    onChange: (e) => onChange(field.key, e.target.value),
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy,
    className: `field-input ${error ? '!border-signal-500' : ''}`,
    placeholder: field.placeholder,
  };

  return (
    <div>
      <label htmlFor={field.key} className="field-label">
        {field.label}
        {field.required && <span className="text-signal-500 ml-1">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea {...commonProps} rows={4} maxLength={field.maxLength} />
      ) : field.type === 'select' ? (
        <select {...commonProps}>
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input {...commonProps} type="text" maxLength={field.maxLength} inputMode={field.key === 'age' ? 'numeric' : undefined} />
      )}

      {field.maxLength && field.type === 'textarea' && (
        <div className="text-xs text-ink-500 mt-1 text-right">
          {(value?.length ?? 0)}/{field.maxLength}
        </div>
      )}

      {error && (
        <p id={describedBy} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
