import nodemailer from 'nodemailer';
import { verifyToken, getBearerToken } from './lib/token.js';
import { sendDirectMessage, postToChannel, createTicketChannel } from './lib/discord.js';
import { getApplicationType, getAllFields } from '../../src/config/applications.js';
import { validateApplication, sanitizeText } from '../../src/utils/validation.js';
import { buildDisplaySections } from '../../src/utils/formatAnswers.js';
import { buildPdfFilename } from '../../src/utils/filename.js';

const MAX_PAYLOAD_BYTES = 8_000_000;
const DEFAULT_RECIPIENT = 'application@minedrop.net';

const recentSubmissions = new Map();
const RATE_LIMIT_WINDOW_MS = 20_000;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function truncate(str, max) {
  if (!str) return '—';
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderEmailHtml({ positionLabel, submittedAt, sections }) {
  const sectionsHtml = sections
    .map(
      (section) => `
        <tr><td style="padding:20px 0 8px 0;">
          <h3 style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#0a0d10;border-bottom:2px solid #37a29f;padding-bottom:6px;">
            ${escapeHtml(section.title)}
          </h3>
        </td></tr>
        ${section.rows
          .map(
            (row) => `
              <tr>
                <td style="padding:8px 0;font-family:Arial,sans-serif;">
                  <div style="font-size:12px;color:#6c7a83;font-weight:bold;margin-bottom:2px;">${escapeHtml(row.label)}</div>
                  <div style="font-size:13.5px;color:#10151a;white-space:pre-wrap;">${escapeHtml(row.value)}</div>
                </td>
              </tr>`
          )
          .join('')}
      `
    )
    .join('');

  return `
  <div style="background:#f4f4f4;padding:24px;">
    <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;">
      <tr>
        <td style="background:#10151a;padding:24px 28px;">
          <div style="font-family:Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:bold;">Minedrop International Network</div>
          <div style="font-family:Arial,sans-serif;color:#98a3aa;font-size:13px;margin-top:4px;">New ${escapeHtml(positionLabel)} Application</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 28px 28px;">
          <table role="presentation" width="100%">
            <tr><td style="font-family:Arial,sans-serif;font-size:12px;color:#6c7a83;padding-top:16px;">Submitted ${escapeHtml(submittedAt)}</td></tr>
            ${sectionsHtml}
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

function buildMailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function buildEmbed(applicationType, cleanValues) {
  return {
    title: `New ${applicationType.label} Application`,
    color: 0x37a29f,
    fields: [
      { name: 'Full Name', value: truncate(cleanValues.fullName, 200), inline: true },
      { name: 'Age', value: truncate(String(cleanValues.age || ''), 50), inline: true },
      { name: 'Discord', value: truncate(cleanValues.discordUsername, 200), inline: true },
      { name: 'Java Username', value: truncate(cleanValues.javaUsername || 'Not provided', 200), inline: true },
      { name: 'Bedrock Username', value: truncate(cleanValues.bedrockUsername || 'Not provided', 200), inline: true },
      { name: 'Email', value: truncate(cleanValues.email, 200), inline: true },
      { name: 'Country', value: truncate(cleanValues.country, 100), inline: true },
      { name: 'State / Province / Region', value: truncate(cleanValues.state, 100), inline: true },
      { name: 'Timezone', value: truncate(cleanValues.timezone, 100), inline: true },
    ],
    footer: { text: `Full application attached as PDF · ${new Date().toISOString()}` },
  };
}

async function deliverByEmail({ applicationType, cleanValues, sections, submittedAt, filename, pdfBuffer }) {
  const transporter = buildMailTransport();
  if (!transporter) return { attempted: false };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.RECIPIENT_EMAIL || DEFAULT_RECIPIENT,
      replyTo: cleanValues.email || undefined,
      subject: `New ${applicationType.label} Application — ${cleanValues.fullName || cleanValues.discordUsername}`,
      html: renderEmailHtml({ positionLabel: applicationType.label, submittedAt, sections }),
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });
    return { attempted: true, ok: true };
  } catch (err) {
    console.error('submit-application: email delivery failed:', err.message);
    return { attempted: true, ok: false };
  }
}

async function deliverByWebhook({ applicationType, cleanValues, filename, pdfBuffer }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { attempted: false };

  const form = new FormData();
  form.append(
    'payload_json',
    JSON.stringify({
      content: `📋 New **${applicationType.label}** application from **${cleanValues.fullName || cleanValues.discordUsername}**`,
      embeds: [buildEmbed(applicationType, cleanValues)],
    })
  );
  form.append('files[0]', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

  try {
    const res = await fetch(webhookUrl, { method: 'POST', body: form });
    if (!res.ok) {
      console.error('submit-application: Discord webhook responded with', res.status);
      return { attempted: true, ok: false };
    }
    return { attempted: true, ok: true };
  } catch (err) {
    console.error('submit-application: Discord webhook request failed:', err.message);
    return { attempted: true, ok: false };
  }
}

async function deliverToApplicantByEmail({ applicationType, cleanValues, filename, pdfBuffer }) {
  const transporter = buildMailTransport();
  if (!transporter || !cleanValues.email) return { attempted: false };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: cleanValues.email,
      subject: `Your Minedrop ${applicationType.label} application`,
      text: `Hi ${cleanValues.fullName || 'there'},\n\nThanks for applying to Minedrop International Network. A copy of your ${applicationType.label} application is attached for your records.\n\nWe'll be in touch on Discord.\n\nMinedrop International Network`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });
    return { attempted: true, ok: true };
  } catch (err) {
    console.error('submit-application: applicant confirmation email failed (non-blocking):', err.message);
    return { attempted: true, ok: false };
  }
}

async function deliverByTicket({ applicationType, cleanValues, session, filename, pdfBuffer }) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const categoryId = process.env.DISCORD_TICKET_CATEGORY_ID;
  if (!botToken || !guildId || !categoryId) return { attempted: false };

  try {
    const channel = await createTicketChannel({
      botToken,
      botUserId: process.env.DISCORD_CLIENT_ID || null,
      guildId,
      categoryId,
      staffRoleId: process.env.DISCORD_STAFF_ROLE_ID || null,
      applicantId: session.discordId,
      name: `application-${(cleanValues.fullName || session.discordUsername || 'applicant').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}`,
    });
    await postToChannel({
      botToken,
      channelId: channel.id,
      content: `📋 New **${applicationType.label}** application from <@${session.discordId}>`,
      embeds: [buildEmbed(applicationType, cleanValues)],
      filename,
      fileBuffer: pdfBuffer,
    });
    return { attempted: true, ok: true };
  } catch (err) {
    console.error('submit-application: ticket creation failed:', err.message);
    return { attempted: true, ok: false };
  }
}

async function deliverByDM({ session, filename, pdfBuffer, applicationType }) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || !session.discordId) return { attempted: false };

  try {
    await sendDirectMessage({
      botToken,
      userId: session.discordId,
      content: `Thanks for applying to Minedrop! Here's a copy of your **${applicationType.label}** application for your records.`,
      filename,
      fileBuffer: pdfBuffer,
    });
    return { attempted: true, ok: true };
  } catch (err) {
    console.error('submit-application: DM to applicant failed (this is non-blocking, likely DMs disabled):', err.message);
    return { attempted: true, ok: false };
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { message: 'Method not allowed.' });
  }

  const contentLength = Number(event.headers['content-length'] || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse(413, { message: 'Request too large.' });
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error('submit-application: SESSION_SECRET is not configured.');
    return jsonResponse(500, { message: 'The application portal is not configured yet. Please contact an administrator.' });
  }
  const token = getBearerToken(event);
  const session = verifyToken(token, secret);
  if (!session || !session.discordId) {
    return jsonResponse(401, { message: 'Your session has expired. Please log in again.' });
  }

  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown';
  const lastSubmit = recentSubmissions.get(ip);
  if (lastSubmit && Date.now() - lastSubmit < RATE_LIMIT_WINDOW_MS) {
    return jsonResponse(429, { message: "You're submitting too quickly. Please wait a moment and try again." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { message: 'Malformed request body.' });
  }

  if (payload._hp) {
    return jsonResponse(200, { success: true });
  }

  const applicationType = getApplicationType(payload.positionId);
  if (!applicationType) {
    return jsonResponse(400, { message: 'Unknown position.' });
  }

  const values = {
    ...(payload.values && typeof payload.values === 'object' ? payload.values : {}),
    discordUsername: session.discordUsername,
  };
  const fields = getAllFields(applicationType);

  const { valid, errors } = validateApplication(fields, values);
  if (!valid) {
    const firstError = Object.values(errors)[0];
    return jsonResponse(400, { message: firstError || 'Please check your answers and try again.' });
  }

  const cleanValues = {};
  for (const field of fields) {
    const v = values[field.key];
    cleanValues[field.key] = typeof v === 'string' ? sanitizeText(v) : v;
  }
  if (typeof values.country === 'string') cleanValues.country = sanitizeText(values.country);
  if (typeof values.state === 'string') cleanValues.state = sanitizeText(values.state);
  if (typeof values.timezone === 'string') cleanValues.timezone = sanitizeText(values.timezone);
  cleanValues.discordUsername = session.discordUsername;

  const applicantName = cleanValues.fullName || session.discordUsername || 'Applicant';
  const filename = buildPdfFilename(applicationType.label, applicantName);
  const submittedAt = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const sections = buildDisplaySections(applicationType, cleanValues);

  if (typeof payload.pdfBase64 !== 'string' || payload.pdfBase64.length === 0) {
    return jsonResponse(400, { message: 'Missing generated PDF.' });
  }

  let pdfBuffer;
  try {
    pdfBuffer = Buffer.from(payload.pdfBase64, 'base64');
  } catch (err) {
    console.error('submit-application: failed to decode PDF:', err.message);
    return jsonResponse(400, { message: 'The generated PDF could not be processed. Please try again.' });
  }

  const [emailResult, webhookResult, ticketResult] = await Promise.all([
    deliverByEmail({ applicationType, cleanValues, sections, submittedAt, filename, pdfBuffer }),
    deliverByWebhook({ applicationType, cleanValues, filename, pdfBuffer }),
    deliverByTicket({ applicationType, cleanValues, session, filename, pdfBuffer }),
  ]);

  const anyConfigured = emailResult.attempted || webhookResult.attempted || ticketResult.attempted;
  if (!anyConfigured) {
    console.error('submit-application: no team delivery channel configured (SMTP_*, DISCORD_WEBHOOK_URL, or DISCORD_TICKET_CATEGORY_ID).');
    return jsonResponse(500, { message: 'The server is not configured to receive applications right now. Please try again later or contact staff directly.' });
  }

  const anySucceeded = emailResult.ok || webhookResult.ok || ticketResult.ok;
  if (!anySucceeded) {
    return jsonResponse(502, { message: 'We could not deliver your application right now. Please try again in a few minutes.' });
  }

  const [dmResult, applicantEmailResult] = await Promise.all([
    deliverByDM({ session, filename, pdfBuffer, applicationType }),
    deliverToApplicantByEmail({ applicationType, cleanValues, filename, pdfBuffer }),
  ]);

  recentSubmissions.set(ip, Date.now());
  if (recentSubmissions.size > 500) {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    for (const [key, ts] of recentSubmissions) {
      if (ts < cutoff) recentSubmissions.delete(key);
    }
  }

  return jsonResponse(200, { success: true, dmSent: Boolean(dmResult.ok), emailSent: Boolean(applicantEmailResult.ok) });
}
