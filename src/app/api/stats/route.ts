import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get("building_id");

  const db = getDb();
  try {
    const buildingFilter = buildingId ? "WHERE building_id = $1" : "";
    const params = buildingId ? [buildingId] : [];

    const [buildings, candidates, pipeline, recentOutreach, roleBreakdown] = await Promise.all([
      db.query("SELECT COUNT(*) FROM buildings"),
      db.query(`SELECT COUNT(*) FROM candidates ${buildingFilter}`, params),
      db.query(
        `SELECT status, COUNT(*) as count FROM candidates ${buildingFilter} GROUP BY status ORDER BY count DESC`,
        params
      ),
      db.query(
        `SELECT COUNT(*) FROM outreach WHERE sent_at > NOW() - INTERVAL '7 days'`
      ),
      db.query(
        `SELECT role_type, COUNT(*) as count FROM candidates ${buildingFilter} GROUP BY role_type ORDER BY count DESC`,
        params
      ),
    ]);

    return NextResponse.json({
      total_buildings: parseInt(buildings.rows[0].count),
      total_candidates: parseInt(candidates.rows[0].count),
      pipeline: pipeline.rows,
      outreach_this_week: parseInt(recentOutreach.rows[0].count),
      role_breakdown: roleBreakdown.rows,
    });
  } finally {
    await db.end();
  }
}
