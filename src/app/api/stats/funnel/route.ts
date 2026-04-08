import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get("building_id");
  const days = parseInt(searchParams.get("days") || "30");

  const db = getDb();
  try {
    const filter = buildingId ? "AND c.building_id = $2" : "";
    const dateFilter = `AND c.created_at > NOW() - INTERVAL '${days} days'`;
    const params: unknown[] = [days];
    if (buildingId) params.push(buildingId);

    // Pipeline funnel
    const funnel = await db.query(
      `SELECT status, COUNT(*) as count FROM candidates c
       WHERE created_at > NOW() - INTERVAL '1 day' * $1 ${filter}
       GROUP BY status`,
      params
    );

    // Source effectiveness
    const sources = await db.query(
      `SELECT source,
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE status IN ('contacted','responded','interested','interviewing','offered','hired')) as engaged,
              COUNT(*) FILTER (WHERE status = 'hired') as hired
       FROM candidates c
       WHERE created_at > NOW() - INTERVAL '1 day' * $1 ${filter}
       GROUP BY source ORDER BY total DESC`,
      params
    );

    // Time to hire (avg days from discovered to hired)
    const timeToHire = await db.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (hired_at - created_at)) / 86400) as avg_days
       FROM candidates c
       WHERE status = 'hired' AND hired_at IS NOT NULL
       ${filter}`,
      buildingId ? [buildingId] : []
    );

    // Activity by day (last 14 days)
    const dailyActivity = await db.query(
      `SELECT DATE(created_at) as day, COUNT(*) as candidates_added
       FROM candidates c
       WHERE created_at > NOW() - INTERVAL '14 days' ${filter}
       GROUP BY DATE(created_at) ORDER BY day`,
      buildingId ? [buildingId] : []
    );

    // Outreach stats
    const outreachStats = await db.query(
      `SELECT type, COUNT(*) as count FROM outreach
       WHERE sent_at > NOW() - INTERVAL '1 day' * $1
       GROUP BY type ORDER BY count DESC`,
      [days]
    );

    // Overdue follow-ups
    const overdueCount = await db.query(
      `SELECT COUNT(*) FROM follow_ups f
       JOIN candidates c ON f.candidate_id = c.id
       WHERE f.completed = FALSE AND f.due_date < NOW()
       ${filter}`,
      buildingId ? [buildingId] : []
    );

    // Conversion rates
    const totalDiscovered = funnel.rows.reduce((sum: number, r: Record<string, string>) => sum + parseInt(r.count), 0);
    const contacted = funnel.rows.filter((r: Record<string, string>) =>
      ["contacted", "responded", "interested", "interviewing", "offered", "hired"].includes(r.status)
    ).reduce((sum: number, r: Record<string, string>) => sum + parseInt(r.count), 0);
    const interested = funnel.rows.filter((r: Record<string, string>) =>
      ["interested", "interviewing", "offered", "hired"].includes(r.status)
    ).reduce((sum: number, r: Record<string, string>) => sum + parseInt(r.count), 0);
    const hired = funnel.rows.filter((r: Record<string, string>) => r.status === "hired")
      .reduce((sum: number, r: Record<string, string>) => sum + parseInt(r.count), 0);

    return NextResponse.json({
      funnel: funnel.rows,
      sources: sources.rows,
      avg_time_to_hire_days: timeToHire.rows[0]?.avg_days ? Math.round(parseFloat(timeToHire.rows[0].avg_days)) : null,
      daily_activity: dailyActivity.rows,
      outreach_by_type: outreachStats.rows,
      overdue_followups: parseInt(overdueCount.rows[0].count),
      conversion: {
        discovered_to_contacted: totalDiscovered > 0 ? Math.round((contacted / totalDiscovered) * 100) : 0,
        contacted_to_interested: contacted > 0 ? Math.round((interested / contacted) * 100) : 0,
        interested_to_hired: interested > 0 ? Math.round((hired / interested) * 100) : 0,
        overall: totalDiscovered > 0 ? Math.round((hired / totalDiscovered) * 100) : 0,
      },
      period_days: days,
    });
  } finally {
    await db.end();
  }
}
