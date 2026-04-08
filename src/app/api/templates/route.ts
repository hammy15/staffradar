import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  try {
    const result = await db.query("SELECT * FROM outreach_templates ORDER BY stage, type, name");
    return NextResponse.json(result.rows);
  } finally {
    await db.end();
  }
}
