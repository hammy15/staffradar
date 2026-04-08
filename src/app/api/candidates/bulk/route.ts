import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const { ids, status, building_id, assigned_to } = await req.json();

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No candidate IDs provided" }, { status: 400 });
  }

  const db = getDb();
  try {
    const updates: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let idx = 1;

    if (status) { updates.push(`status = $${idx++}`); values.push(status); }
    if (building_id !== undefined) { updates.push(`building_id = $${idx++}`); values.push(building_id || null); }
    if (assigned_to !== undefined) { updates.push(`assigned_to = $${idx++}`); values.push(assigned_to || null); }

    if (updates.length <= 1) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Build IN clause
    const placeholders = ids.map((_: string, i: number) => `$${idx + i}`).join(",");
    values.push(...ids);

    const result = await db.query(
      `UPDATE candidates SET ${updates.join(", ")} WHERE id IN (${placeholders})`,
      values
    );

    return NextResponse.json({ updated: result.rowCount });
  } finally {
    await db.end();
  }
}
