import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { scoreCandidate } from "@/lib/scoring";
import type { Candidate, Building } from "@/lib/types";

// Score all candidates for a building (or all)
export async function POST(req: NextRequest) {
  const { building_id } = await req.json();

  const db = getDb();
  try {
    let building: Building | null = null;
    if (building_id) {
      const bRes = await db.query("SELECT * FROM buildings WHERE id = $1", [building_id]);
      building = bRes.rows[0] || null;
    }

    const filter = building_id ? "WHERE building_id = $1" : "";
    const params = building_id ? [building_id] : [];
    const result = await db.query(`SELECT * FROM candidates ${filter}`, params);

    let updated = 0;
    for (const candidate of result.rows as Candidate[]) {
      const breakdown = scoreCandidate(candidate, building);
      await db.query("UPDATE candidates SET score = $1, updated_at = NOW() WHERE id = $2", [breakdown.total, candidate.id]);
      updated++;
    }

    return NextResponse.json({ updated, building: building?.name || "all" });
  } finally {
    await db.end();
  }
}
