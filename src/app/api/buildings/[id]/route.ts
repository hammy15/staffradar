import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  try {
    const result = await db.query("SELECT * FROM buildings WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } finally {
    await db.end();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, type, address, city, state, zip, phone } = body;

  const db = getDb();
  try {
    const result = await db.query(
      `UPDATE buildings SET name=$1, type=$2, address=$3, city=$4, state=$5, zip=$6, phone=$7
       WHERE id=$8 RETURNING *`,
      [name, type, address, city, state, zip, phone || null, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } finally {
    await db.end();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  try {
    await db.query("DELETE FROM buildings WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } finally {
    await db.end();
  }
}
