import { Resend } from "resend";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
}

export async function sendBookingConfirmation(params: {
  to: string;
  customerName: string;
  serviceName: string;
  startTime: Date;
}) {
  const resend = getClient();
  const formatted = params.startTime.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  if (!resend) {
    console.warn(
      `[mock] No RESEND_API_KEY set — not actually emailing ${params.to}. Would have sent: "Booking confirmed: ${params.serviceName}" for ${formatted}.`,
    );
    return;
  }

  await resend.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Booking confirmed: ${params.serviceName}`,
    html: `
      <p>Hi ${params.customerName},</p>
      <p>Your booking is confirmed:</p>
      <p><strong>${params.serviceName}</strong><br />${formatted}</p>
      <p>See you then!</p>
    `,
  });
}

export async function sendBookingReminder(params: {
  to: string;
  customerName: string;
  serviceName: string;
  startTime: Date;
}) {
  const resend = getClient();
  const formatted = params.startTime.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  if (!resend) {
    console.warn(
      `[mock] No RESEND_API_KEY set — not actually emailing ${params.to}. Would have sent: "Reminder: ${params.serviceName} tomorrow" for ${formatted}.`,
    );
    return;
  }

  await resend.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Reminder: ${params.serviceName} tomorrow`,
    html: `
      <p>Hi ${params.customerName},</p>
      <p>Just a reminder about your upcoming appointment:</p>
      <p><strong>${params.serviceName}</strong><br />${formatted}</p>
      <p>See you soon!</p>
    `,
  });
}
