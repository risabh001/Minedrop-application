export function sanitizeFilenamePart(str) {
  return (
    String(str || '')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Applicant'
  );
}

export function buildPdfFilename(positionLabel, applicantName) {
  return `Minedrop_${sanitizeFilenamePart(positionLabel)}_Application_${sanitizeFilenamePart(applicantName)}.pdf`;
}
