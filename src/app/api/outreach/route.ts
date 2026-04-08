import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidate_id");

  const db = getDb();
  try {
    let result;
    if (candidateId) {
      result = await db.query(
        "SELECT o.*, u.name as user_name FROM outreach o LEFT JOIN users u ON o.user_id = u.id WHERE o.candidate_id = $1 ORDER BY o.sent_at DESC",
        [candidateId]
      );
    } else {
      result = await db.query(
        `SELECT o.*, u.name as user_name, c.first_name, c.last_name
         FROM outreach o
         LEFT JOIN users u ON o.user_id = u.id
         LEFT JOIN candidates c ON o.candidate_id = c.id
         ORDER BY o.sent_at DESC LIMIT 100`
      );
    }
    return NextResponse.json(result.rows);
  } finally {
    await db.end();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { candidate_id, user_id, type, subject, content } = body;

  if (!candidate_id || !type || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = await db.query(
      `INSERT INTO outreach (candidate_id, user_id, type, subject, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [candidate_id, user_id || null, type, subject || null, content]
    );

    // Update candidate status to contacted if currently discovered/researched
    await db.query(
      `UPDATE candidates SET status = 'contacted', updated_at = NOW()
       WHERE id = $1 AND status IN ('discovered', 'researched')`,
      [candidate_id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } finally {
    await db.end();
  }
}
