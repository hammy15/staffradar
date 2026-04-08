import sgMail from "@sendgrid/mail";

let initialized = false;

function initSendGrid() {
  if (!initialized && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    initialized = true;
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
}): Promise<{ success: boolean; error?: string }> {
  initSendGrid();

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    return { success: false, error: "SendGrid not configured. Add SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to env." };
  }

  try {
    await sgMail.send({
      to: params.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: params.fromName || "StaffRadar Recruiting",
      },
      subject: params.subject,
      text: params.body,
      html: generateEmailHtml(params.subject, params.body),
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

function generateEmailHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: linear-gradient(135deg, #0ea5e9, #06b6d4); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 20px;">StaffRadar</h1>
  </div>
  <div style="padding: 0 8px;">
    ${body.split("\n").map((line) => `<p style="color: #334155; line-height: 1.6; margin: 8px 0;">${line}</p>`).join("")}
  </div>
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px;">Sent via StaffRadar Healthcare Talent Platform</p>
  </div>
</body>
</html>`;
}
