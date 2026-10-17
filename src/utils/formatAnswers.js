export function formatFieldValue(field, value) {
  if (field.type === 'checkbox') {
    return value === true ? 'Yes' : 'No';
  }
  if (field.type === 'checkboxGroup') {
    return Array.isArray(value) && value.length ? value.join(', ') : 'None selected';
  }
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  return String(value);
}

export function buildDisplaySections(applicationType, values) {
  return applicationType.sections.map((section) => ({
    title: section.title,
    rows: section.fields.flatMap((field) => {
      if (field.type === 'locationGroup') {
        return [
          { label: 'Country', value: values.country || '—' },
          { label: 'State / Province / Region', value: values.state || '—' },
          { label: 'Timezone', value: values.timezone || '—' },
        ];
      }
      return [{ label: field.label, value: formatFieldValue(field, values[field.key]) }];
    }),
  }));
}
