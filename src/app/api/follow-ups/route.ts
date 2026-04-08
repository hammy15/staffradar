import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidate_id");
  const overdue = searchParams.get("overdue");
  const upcoming = searchParams.get("upcoming");
  const buildingId = searchParams.get("building_id");

  const db = getDb();
  try {
    let query = `
      SELECT f.*, c.first_name, c.last_name, c.role_type, c.status as candidate_status,
             c.phone as candidate_phone, c.email as candidate_email,
             b.name as building_name, u.name as user_name
      FROM follow_ups f
      JOIN candidates c ON f.candidate_id = c.id
      LEFT JOIN buildings b ON c.building_id = b.id
      LEFT JOIN users u ON f.user_id = u.id
    `;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (candidateId) {
      conditions.push(`f.candidate_id = $${idx++}`);
      values.push(candidateId);
    }
    if (buildingId) {
      conditions.push(`c.building_id = $${idx++}`);
      values.push(buildingId);
    }
    if (overdue === "true") {
      conditions.push(`f.completed = FALSE AND f.due_date < NOW()`);
    }
    if (upcoming === "true") {
      conditions.push(`f.completed = FALSE AND f.due_date >= NOW() AND f.due_date < NOW() + INTERVAL '7 days'`);
    }
    if (!overdue && !upcoming && !candidateId) {
      conditions.push(`f.completed = FALSE`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY f.due_date ASC LIMIT 100`;

    const result = await db.query(query, values);
    return NextResponse.json(result.rows);
  } finally {
    await db.end();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { candidate_id, type, note, due_date } = body;

  if (!candidate_id || !due_date) {
    return NextResponse.json({ error: "candidate_id and due_date required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const userCookie = cookieStore.get("sr_user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;

  const db = getDb();
  try {
    const result = await db.query(
      `INSERT INTO follow_ups (candidate_id, user_id, type, note, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [candidate_id, user?.id || null, type || "callback", note || null, due_date]
    );

    // Update candidate's next_followup_at
    await db.query(
      `UPDATE candidates SET next_followup_at = $1, updated_at = NOW() WHERE id = $2`,
      [due_date, candidate_id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } finally {
    await db.end();
  }
}
