import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get("building_id");
  const status = searchParams.get("status");
  const roleType = searchParams.get("role_type");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (buildingId) {
    conditions.push(`c.building_id = $${paramIdx++}`);
    values.push(buildingId);
  }
  if (status) {
    conditions.push(`c.status = $${paramIdx++}`);
    values.push(status);
  }
  if (roleType) {
    conditions.push(`c.role_type = $${paramIdx++}`);
    values.push(roleType);
  }
  if (search) {
    conditions.push(`(c.first_name ILIKE $${paramIdx} OR c.last_name ILIKE $${paramIdx} OR c.npi ILIKE $${paramIdx})`);
    values.push(`%${search}%`);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const db = getDb();
  try {
    const countResult = await db.query(
      `SELECT COUNT(*) FROM candidates c ${where}`,
      values
    );
    const result = await db.query(
      `SELECT c.*, b.name as building_name
       FROM candidates c
       LEFT JOIN buildings b ON c.building_id = b.id
       ${where}
       ORDER BY c.updated_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...values, limit, offset]
    );
    return NextResponse.json({
      candidates: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } finally {
    await db.end();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    npi, first_name, last_name, credentials, role_type, specialty,
    phone, email, address, city, state, zip, source, source_detail,
    building_id, current_employer, license_state, license_number,
    is_traveler, willingness_to_relocate, notes,
  } = body;

  if (!first_name || !last_name || !role_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  try {
    // Check for duplicate NPI
    if (npi) {
      const existing = await db.query("SELECT id FROM candidates WHERE npi = $1", [npi]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "Candidate with this NPI already exists", existing_id: existing.rows[0].id }, { status: 409 });
      }
    }

    const result = await db.query(
      `INSERT INTO candidates (npi, first_name, last_name, credentials, role_type, specialty,
        phone, email, address, city, state, zip, source, source_detail,
        building_id, current_employer, license_state, license_number,
        is_traveler, willingness_to_relocate, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [npi, first_name, last_name, credentials, role_type, specialty,
        phone, email, address, city, state, zip, source || "manual", source_detail,
        building_id, current_employer, license_state, license_number,
        is_traveler || false, willingness_to_relocate || false, notes]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } finally {
    await db.end();
  }
}
