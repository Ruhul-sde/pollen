import nodemailer from "nodemailer";

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;

  const service = process.env.EMAIL_SERVICE || "gmail";

  transporter = nodemailer.createTransport({
    service,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

export async function sendMail({ to, subject, html, text, attachments = [] }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Email] EMAIL_USER/EMAIL_PASS not set — skipping email send");
    return { skipped: true };
  }

  const transport = getTransporter();
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Pollen Store"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
    attachments,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("[Email] Failed to send:", err.message);
    throw err;
  }
}
