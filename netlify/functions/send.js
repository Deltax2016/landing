// Netlify Function for the СУТКИ. contact form.
// Sends an email to TO_EMAIL via Resend.
//
// Required env var: RESEND_API_KEY
// Optional env vars:
//   FROM_EMAIL  — verified sender (default: "СУТКИ. <onboarding@resend.dev>")
//   TO_EMAIL    — destination     (default: "emils99mail@gmail.com")

const TO_EMAIL   = process.env.TO_EMAIL   || 'emils99mail@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'СУТКИ. <onboarding@resend.dev>';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const json = (statusCode, payload, extraHeaders = {}) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...extraHeaders },
  body: JSON.stringify(payload),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method not allowed' }, { Allow: 'POST' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'RESEND_API_KEY is not configured on the server' });
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  const name    = (body.name    || '').toString().trim().slice(0, 200);
  const contact = (body.contact || '').toString().trim().slice(0, 300);
  const service = (body.service || '').toString().trim().slice(0, 300);
  const comment = (body.comment || '').toString().trim().slice(0, 4000);

  if (!contact) {
    return json(400, { error: 'contact is required' });
  }

  const subject = `СУТКИ. — новая заявка${name ? ': ' + name : ''}`;

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; background:#0d0c0a; color:#f3ece0; padding:32px; max-width:600px; border-radius:16px;">
      <div style="font-size:13px; letter-spacing:.08em; color:#ff5c1f; text-transform:uppercase; margin-bottom:8px;">сутки. — новая заявка</div>
      <h1 style="font-family: Georgia, serif; font-style: italic; font-size:36px; margin:0 0 24px; color:#f3ece0;">${escapeHtml(name) || 'без имени'}</h1>
      <table style="width:100%; border-collapse: collapse; font-size:14px;">
        <tr>
          <td style="padding:12px 0; border-bottom:1px solid rgba(243,236,224,.12); color:#807a69; width:140px;">контакт</td>
          <td style="padding:12px 0; border-bottom:1px solid rgba(243,236,224,.12); color:#f3ece0;">${escapeHtml(contact)}</td>
        </tr>
        <tr>
          <td style="padding:12px 0; border-bottom:1px solid rgba(243,236,224,.12); color:#807a69;">услуга</td>
          <td style="padding:12px 0; border-bottom:1px solid rgba(243,236,224,.12); color:#f3ece0;">${escapeHtml(service) || '—'}</td>
        </tr>
        <tr>
          <td style="padding:12px 0; vertical-align: top; color:#807a69;">комментарий</td>
          <td style="padding:12px 0; color:#f3ece0; white-space: pre-wrap;">${escapeHtml(comment) || '—'}</td>
        </tr>
      </table>
      <p style="margin-top:24px; font-size:12px; color:#807a69;">отправлено формой на лендинге СУТКИ.</p>
    </div>
  `;

  const text = [
    `СУТКИ. — новая заявка`,
    ``,
    `имя:        ${name || '—'}`,
    `контакт:    ${contact}`,
    `услуга:     ${service || '—'}`,
    `комментарий:`,
    comment || '—',
  ].join('\n');

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject,
        html,
        text,
        reply_to: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : undefined,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend error:', resendRes.status, errBody);
      return json(502, { error: 'не удалось отправить письмо' });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('Send error:', err);
    return json(500, { error: 'внутренняя ошибка сервера' });
  }
};
