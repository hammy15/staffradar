import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  try {
    const result = await db.query("SELECT * FROM buildings ORDER BY name");
    return NextResponse.json(result.rows);
  } finally {
    await db.end();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, address, city, state, zip, phone } = body;
  if (!name || !type || !address || !city || !state || !zip) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = await db.query(
      `INSERT INTO buildings (name, type, address, city, state, zip, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type, address, city, state, zip, phone || null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } finally {
    await db.end();
  }
}
