import { useEffect } from 'react';
import { COUNTRIES, getCountry } from '../config/geo.js';

export default function LocationFields({ values, errors, onChange }) {
  const country = values.country || '';
  const countryData = getCountry(country);
  const hasStateList = Boolean(countryData?.states?.length);
  const hasMultipleTimezones = Boolean(countryData && countryData.timezones.length > 1);

  useEffect(() => {
    if (countryData && countryData.timezones.length === 1 && values.timezone !== countryData.timezones[0]) {
      onChange('timezone', countryData.timezones[0]);
    }
  }, [country]);

  function handleCountryChange(next) {
    onChange('country', next);
    onChange('state', '');
    onChange('timezone', '');
  }

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <div className="sm:col-span-2">
        <label htmlFor="country" className="field-label">
          Country <span className="text-signal-500 ml-1">*</span>
        </label>
        <select
          id="country"
          className={`field-input ${errors.country ? '!border-signal-500' : ''}`}
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          <option value="">Select a country...</option>
          {COUNTRIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.country && <p className="field-error">{errors.country}</p>}
      </div>

      <div>
        <label htmlFor="state" className="field-label">
          State / Province / Region <span className="text-signal-500 ml-1">*</span>
        </label>
        {hasStateList ? (
          <select
            id="state"
            className={`field-input ${errors.state ? '!border-signal-500' : ''}`}
            value={values.state || ''}
            onChange={(e) => onChange('state', e.target.value)}
          >
            <option value="">Select...</option>
            {countryData.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="state"
            type="text"
            className={`field-input ${errors.state ? '!border-signal-500' : ''}`}
            value={values.state || ''}
            onChange={(e) => onChange('state', e.target.value)}
            placeholder={country ? 'Enter your state, province, or region' : 'Select a country first'}
            disabled={!country}
            maxLength={100}
          />
        )}
        {errors.state && <p className="field-error">{errors.state}</p>}
      </div>

      <div>
        <label htmlFor="timezone" className="field-label">
          Timezone <span className="text-signal-500 ml-1">*</span>
        </label>
        {hasMultipleTimezones ? (
          <select
            id="timezone"
            className={`field-input ${errors.timezone ? '!border-signal-500' : ''}`}
            value={values.timezone || ''}
            onChange={(e) => onChange('timezone', e.target.value)}
          >
            <option value="">Select your timezone...</option>
            {countryData.timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="timezone"
            type="text"
            readOnly
            className="field-input opacity-70 cursor-not-allowed"
            value={countryData ? countryData.timezones[0] : ''}
            placeholder="Select a country first"
          />
        )}
        {errors.timezone && <p className="field-error">{errors.timezone}</p>}
      </div>
    </div>
  );
}
