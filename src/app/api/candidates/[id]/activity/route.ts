import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  try {
    // Get outreach history
    const outreach = await db.query(
      `SELECT o.*, u.name as user_name, 'outreach' as activity_type
       FROM outreach o LEFT JOIN users u ON o.user_id = u.id
       WHERE o.candidate_id = $1 ORDER BY o.sent_at DESC`,
      [id]
    );

    // Get follow-ups
    const followups = await db.query(
      `SELECT f.*, u.name as user_name, 'followup' as activity_type
       FROM follow_ups f LEFT JOIN users u ON f.user_id = u.id
       WHERE f.candidate_id = $1 ORDER BY f.created_at DESC`,
      [id]
    );

    // Get activity log
    const activity = await db.query(
      `SELECT a.*, u.name as user_name, 'log' as activity_type
       FROM activity_log a LEFT JOIN users u ON a.user_id = u.id
       WHERE a.candidate_id = $1 ORDER BY a.created_at DESC`,
      [id]
    );

    // Merge and sort by date
    const all = [
      ...outreach.rows.map((r: Record<string, unknown>) => ({ ...r, sort_date: r.sent_at })),
      ...followups.rows.map((r: Record<string, unknown>) => ({ ...r, sort_date: r.created_at })),
      ...activity.rows.map((r: Record<string, unknown>) => ({ ...r, sort_date: r.created_at })),
    ].sort((a, b) => new Date(b.sort_date as string).getTime() - new Date(a.sort_date as string).getTime());

    return NextResponse.json(all);
  } finally {
    await db.end();
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action, details, user_id, building_id } = await req.json();

  const db = getDb();
  try {
    const result = await db.query(
      `INSERT INTO activity_log (candidate_id, user_id, building_id, action, details)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, user_id || null, building_id || null, action, details ? JSON.stringify(details) : null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } finally {
    await db.end();
  }
}
