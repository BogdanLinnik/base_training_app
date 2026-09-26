import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!gmailUser || !gmailAppPassword) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword },
    });
  }
  return transporter;
}

/** Best-effort email send — never throws, so a mail failure can't break the request. */
export async function sendMail(to: string, subject: string, text: string) {
  const t = getTransporter();
  if (!t) {
    console.warn("GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping email send");
    return;
  }
  try {
    await t.sendMail({ from: `"Тренування" <${gmailUser}>`, to, subject, text });
  } catch (err) {
    console.error("Failed to send notification email", err);
  }
}
