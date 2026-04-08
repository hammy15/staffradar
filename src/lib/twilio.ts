import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export async function sendSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const c = getTwilioClient();
  if (!c) return { success: false, error: "Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to env." };

  try {
    // Clean phone number
    let phone = to.replace(/[^\d+]/g, "");
    if (!phone.startsWith("+")) phone = "+1" + phone;

    const msg = await c.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { success: true, sid: msg.sid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
