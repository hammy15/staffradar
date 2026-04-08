import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  try {
    const result = await db.query(
      `SELECT c.*, b.name as building_name
       FROM candidates c
       LEFT JOIN buildings b ON c.building_id = b.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const outreach = await db.query(
      "SELECT * FROM outreach WHERE candidate_id = $1 ORDER BY sent_at DESC",
      [id]
    );
    return NextResponse.json({ ...result.rows[0], outreach: outreach.rows });
  } finally {
    await db.end();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowedFields = [
    "first_name", "last_name", "credentials", "role_type", "specialty",
    "phone", "email", "address", "city", "state", "zip", "status",
    "building_id", "assigned_to", "current_employer", "license_state",
    "license_number", "is_traveler", "willingness_to_relocate", "notes", "score",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      fields.push(`${field} = $${idx++}`);
      values.push(body[field]);
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const db = getDb();
  try {
    const result = await db.query(
      `UPDATE candidates SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } finally {
    await db.end();
  }
}
