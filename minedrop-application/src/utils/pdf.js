import { jsPDF } from 'jspdf';
import { site } from '../config/site.js';
import { buildPdfFilename } from './filename.js';

const PAGE_MARGIN = 48;
const LINE_HEIGHT = 14;

export { buildPdfFilename };

export function generateApplicationPdf({ positionLabel, applicantName, submittedAt, sections }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  let y = PAGE_MARGIN;

  function ensureSpace(neededHeight) {
    if (y + neededHeight > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  }

  function writeHeading(text, size = 12) {
    ensureSpace(LINE_HEIGHT + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    doc.text(text, PAGE_MARGIN, y);
    y += size * 1.1;
  }

  function writeLabel(text) {
    ensureSpace(LINE_HEIGHT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(60, 90, 70);
    doc.text(text, PAGE_MARGIN, y);
    y += LINE_HEIGHT;
  }

  function writeBody(text) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(text || '—', contentWidth);
    for (const line of lines) {
      ensureSpace(LINE_HEIGHT);
      doc.text(line, PAGE_MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += 6;
  }

  function divider() {
    ensureSpace(14);
    doc.setDrawColor(210, 210, 210);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    y += 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(site.orgName, PAGE_MARGIN, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Application: ${positionLabel}`, PAGE_MARGIN, y);
  y += 16;

  doc.setFontSize(9.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Submitted: ${submittedAt}`, PAGE_MARGIN, y);
  y += 22;

  divider();

  for (const section of sections) {
    writeHeading(section.title, 12.5);
    for (const row of section.rows) {
      writeLabel(row.label);
      writeBody(row.value);
    }
    y += 4;
  }

  const filename = buildPdfFilename(positionLabel, applicantName);
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];

  return { blob, base64, filename };
}

export function downloadPdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
