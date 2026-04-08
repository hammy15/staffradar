import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const db = getDb();
  try {
    if (body.completed) {
      await db.query(
        `UPDATE follow_ups SET completed = TRUE, completed_at = NOW() WHERE id = $1`,
        [id]
      );
    }
    if (body.due_date) {
      await db.query(`UPDATE follow_ups SET due_date = $1 WHERE id = $2`, [body.due_date, id]);
    }
    if (body.note !== undefined) {
      await db.query(`UPDATE follow_ups SET note = $1 WHERE id = $2`, [body.note, id]);
    }

    const result = await db.query("SELECT * FROM follow_ups WHERE id = $1", [id]);
    return NextResponse.json(result.rows[0]);
  } finally {
    await db.end();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  try {
    await db.query("DELETE FROM follow_ups WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } finally {
    await db.end();
  }
}
