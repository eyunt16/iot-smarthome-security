const nodemailer = require('nodemailer');

let transporter;

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST
      && process.env.SMTP_PORT
      && process.env.SMTP_USER
      && process.env.SMTP_PASS
      && process.env.ADMIN_EMAIL,
  );
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendSecurityAlert({
  subject,
  title,
  message,
  metadata = {},
}) {
  if (!isEmailConfigured()) {
    console.warn(
      'Security alert email skipped because SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, or ADMIN_EMAIL is missing.',
    );
    return { skipped: true };
  }

  const metadataLines = Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${value}`);

  const textBody = [
    'High-priority IoT Smart Home security alert',
    '',
    `Title: ${title}`,
    `Message: ${message}`,
    metadataLines.length ? '' : null,
    ...metadataLines,
    '',
    `Timestamp: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  const htmlMetadata = metadataLines.length
    ? `<ul>${metadataLines.map((line) => `<li>${line}</li>`).join('')}</ul>`
    : '<p>No additional metadata.</p>';

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'high',
    },
    text: textBody,
    html: `
      <h2>${title}</h2>
      <p>${message}</p>
      ${htmlMetadata}
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    `,
  });

  return { delivered: true };
}

module.exports = {
  sendSecurityAlert,
};
