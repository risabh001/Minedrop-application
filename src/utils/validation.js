const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(field, rawValue) {
  if (field.type === 'checkbox') {
    if (field.required && rawValue !== true) {
      return 'You must confirm this to continue.';
    }
    return null;
  }

  if (field.type === 'checkboxGroup') {
    const arr = Array.isArray(rawValue) ? rawValue : [];
    if (field.required && arr.length === 0) {
      return `Select at least one option for "${field.label}".`;
    }
    return null;
  }

  const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

  if (field.required && (value === undefined || value === null || value === '')) {
    return `${field.label} is required.`;
  }

  if (!field.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  if (field.type === 'radio' || field.type === 'select') {
    if (field.options && !field.options.includes(value)) {
      return `Choose a valid option for "${field.label}".`;
    }
    return null;
  }

  if (typeof value === 'string') {
    if (field.minLength && value.length < field.minLength) {
      return `${field.label} needs at least ${field.minLength} characters.`;
    }
    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label} must be under ${field.maxLength} characters.`;
    }
    if (field.isEmail && value && !EMAIL_RE.test(value)) {
      return `Enter a valid email address.`;
    }
    if (field.key === 'age' && value && (!/^\d+$/.test(value) || Number(value) < 10 || Number(value) > 99)) {
      return 'Enter a valid age.';
    }
  }

  return null;
}

export function validateApplication(fields, values) {
  const errors = {};

  for (const field of fields) {
    if (field.type === 'locationGroup') {
      if (!values.country) errors.country = 'Select your country.';
      if (!values.state || !String(values.state).trim()) errors.state = 'State / Province / Region is required.';
      if (!values.timezone || !String(values.timezone).trim()) errors.timezone = 'Select your timezone.';
      continue;
    }
    const err = validateField(field, values[field.key]);
    if (err) errors[field.key] = err;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function sanitizeText(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}
