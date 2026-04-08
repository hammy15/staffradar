import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendSms } from "@/lib/twilio";
import { sendEmail } from "@/lib/sendgrid";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { candidate_id, type, subject, content, to } = body;

  if (!candidate_id || !type || !content || !to) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get user from cookie
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("sr_user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;

  let sendResult: { success: boolean; error?: string; sid?: string };

  if (type === "sms") {
    sendResult = await sendSms(to, content);
  } else if (type === "email") {
    sendResult = await sendEmail({ to, subject: subject || "Opportunity from StaffRadar", body: content });
  } else {
    // For call/linkedin/other, just log it
    sendResult = { success: true };
  }

  const db = getDb();
  try {
    // Log the outreach regardless of send success
    const result = await db.query(
      `INSERT INTO outreach (candidate_id, user_id, type, subject, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [candidate_id, user?.id || null, type, subject || null, content]
    );

    // Update candidate status if currently early-stage
    await db.query(
      `UPDATE candidates SET status = 'contacted', updated_at = NOW()
       WHERE id = $1 AND status IN ('discovered', 'researched')`,
      [candidate_id]
    );

    return NextResponse.json({
      outreach: result.rows[0],
      sent: sendResult.success,
      send_error: sendResult.error || null,
    });
  } finally {
    await db.end();
  }
}
