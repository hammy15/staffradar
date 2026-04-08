import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { advancedScoreCandidate } from "@/lib/sweep";
import type { Building, Candidate } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  try {
    const cRes = await db.query(
      `SELECT c.*, b.name as building_name, b.type as building_type,
              b.city as building_city, b.state as building_state
       FROM candidates c LEFT JOIN buildings b ON c.building_id = b.id
       WHERE c.id = $1`,
      [id]
    );

    if (cRes.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const candidate = cRes.rows[0];

    // If no building assigned, try to score against a default
    let building: Building | null = null;
    if (candidate.building_id) {
      const bRes = await db.query("SELECT * FROM buildings WHERE id = $1", [candidate.building_id]);
      building = bRes.rows[0] || null;
    }

    if (!building) {
      // Get first building as fallback
      const bRes = await db.query("SELECT * FROM buildings LIMIT 1");
      building = bRes.rows[0] || null;
    }

    if (!building) {
      return NextResponse.json({ error: "No buildings configured — add a building first" }, { status: 400 });
    }

    const score = advancedScoreCandidate(candidate as Partial<Candidate>, building);

    // Update candidate score
    await db.query("UPDATE candidates SET score = $1, updated_at = NOW() WHERE id = $2", [score.total, id]);

    return NextResponse.json({
      candidate_id: id,
      building: { name: building.name, state: building.state },
      ...score,
    });
  } finally {
    await db.end();
  }
}
