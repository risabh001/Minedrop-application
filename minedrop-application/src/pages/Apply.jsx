import { useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { getApplicationType, getAllFields } from '../config/applications.js';
import { validateApplication, sanitizeText } from '../utils/validation.js';
import { buildDisplaySections } from '../utils/formatAnswers.js';
import { generateApplicationPdf, downloadPdfBlob } from '../utils/pdf.js';
import { authFetch, isAuthenticated, getSessionUser } from '../utils/auth.js';
import { site } from '../config/site.js';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import FormField from '../components/FormField.jsx';
import LocationFields from '../components/LocationFields.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import { CheckIcon, DownloadIcon } from '../components/Icons.jsx';

export default function Apply() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const applicationType = getApplicationType(positionId);
  const sessionUser = getSessionUser();

  const [values, setValues] = useState({ discordUsername: sessionUser?.discordUsername || '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(null);

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  if (!applicationType) {
    return <Navigate to="/portal" replace />;
  }

  const deliveredExtras = [
    successState?.dmSent && 'sent to you on Discord',
    successState?.emailSent && 'emailed to you',
  ].filter(Boolean);

  function handleChange(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleDownloadAgain() {
    if (successState?.pdfBlob && successState?.pdfFilename) {
      downloadPdfBlob(successState.pdfBlob, successState.pdfFilename);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    if (values._hp) {
      return;
    }

    const fields = getAllFields(applicationType);
    const { valid, errors: fieldErrors } = validateApplication(fields, values);
    if (!valid) {
      setErrors(fieldErrors);
      const firstKey = Object.keys(fieldErrors)[0];
      document.getElementById(firstKey)?.focus();
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);

    const cleanValues = {};
    for (const field of fields) {
      const v = values[field.key];
      cleanValues[field.key] = typeof v === 'string' ? sanitizeText(v) : v;
    }
    cleanValues.country = values.country;
    cleanValues.state = values.state;
    cleanValues.timezone = values.timezone;

    const applicantName = cleanValues.fullName || cleanValues.javaUsername || cleanValues.bedrockUsername || 'Applicant';
    const submittedAt = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
    const sections = buildDisplaySections(applicationType, cleanValues);

    let pdfResult;
    try {
      pdfResult = generateApplicationPdf({
        positionLabel: applicationType.label,
        applicantName,
        submittedAt,
        sections,
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
      setSubmitError('We could not generate your PDF. Please try again — if this keeps happening, contact staff directly.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await authFetch('/.netlify/functions/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: applicationType.id,
          values: cleanValues,
          pdfBase64: pdfResult.base64,
          _hp: values._hp || '',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setSubmitError('Your session has expired. Please log in again.');
        setSubmitting(false);
        navigate('/', { replace: true });
        return;
      }

      if (!res.ok) {
        setSubmitError(data.message || 'Something went wrong submitting your application. Please try again.');
        setSubmitting(false);
        return;
      }

      downloadPdfBlob(pdfResult.blob, pdfResult.filename);
      setSuccessState({ pdfBlob: pdfResult.blob, pdfFilename: pdfResult.filename, dmSent: Boolean(data.dmSent), emailSent: Boolean(data.emailSent) });
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setSubmitError('Network error — please check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-5 py-14">
          <p className="text-drop-400 text-sm font-semibold uppercase tracking-wide">{applicationType.label} Application</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink-50 mt-2">{applicationType.shortDescription}</h1>
          <p className="text-ink-400 mt-3">Fields marked with * are required. Take your time — you can't save and resume.</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-8" noValidate>
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="_hp">Leave this field empty</label>
              <input
                id="_hp"
                name="_hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={values._hp || ''}
                onChange={(e) => handleChange('_hp', e.target.value)}
              />
            </div>

            {applicationType.sections.map((section) => (
              <section key={section.id} className="panel p-6 sm:p-7 space-y-6">
                <h2 className="text-lg font-semibold text-ink-50 pb-3 border-b border-ink-700">{section.title}</h2>
                {section.fields.map((field) =>
                  field.type === 'locationGroup' ? (
                    <LocationFields key={field.key} values={values} errors={errors} onChange={handleChange} />
                  ) : field.key === 'discordUsername' ? (
                    <div key={field.key}>
                      <label className="field-label">Discord account</label>
                      <div className="field-input flex items-center justify-between !bg-ink-800/60 cursor-not-allowed">
                        <span className="text-ink-100">{values.discordUsername}</span>
                        <span className="flex items-center gap-1 text-drop-400 text-xs font-semibold">
                          <CheckIcon className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      </div>
                      <p className="field-help">Linked automatically from your Discord login — this can't be edited here.</p>
                    </div>
                  ) : (
                    <FormField
                      key={field.key}
                      field={field}
                      value={values[field.key]}
                      error={errors[field.key]}
                      onChange={handleChange}
                    />
                  )
                )}
              </section>
            ))}

            {submitError && (
              <div className="border border-signal-600 bg-signal-600/10 text-signal-500 rounded-lg px-4 py-3 text-sm">
                {submitError}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <Loader label="Submitting..." /> : 'Submit application'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />

      <Modal open={Boolean(successState)} title="Application Submitted Successfully">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-full bg-drop-500 flex items-center justify-center text-ink-950 shrink-0 mt-0.5">
            <CheckIcon className="w-4 h-4" />
          </span>
          <p>
            Your application has been delivered to the {site.shortName} recruitment team. A PDF copy has been
            downloaded to your device{deliveredExtras.length ? `, and also ${deliveredExtras.join(' and ')}.` : '.'}
          </p>
        </div>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <button onClick={handleDownloadAgain} className="btn-secondary">
            <DownloadIcon className="w-4 h-4" />
            Download PDF again
          </button>
          <Link to="/portal" className="btn-primary">
            Return to Applications
          </Link>
        </div>
      </Modal>
    </div>
  );
}
