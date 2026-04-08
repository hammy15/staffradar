import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get("building_id");
  const status = searchParams.get("status");

  const db = getDb();
  try {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (buildingId) { conditions.push(`c.building_id = $${idx++}`); values.push(buildingId); }
    if (status) { conditions.push(`c.status = $${idx++}`); values.push(status); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await db.query(
      `SELECT c.first_name, c.last_name, c.credentials, c.role_type, c.specialty,
              c.npi, c.phone, c.email, c.address, c.city, c.state, c.zip,
              c.status, c.score, c.source, c.current_employer,
              c.license_state, c.license_number, c.is_traveler, c.willingness_to_relocate,
              c.last_contacted_at, c.next_followup_at, c.notes,
              b.name as building_name, c.created_at
       FROM candidates c
       LEFT JOIN buildings b ON c.building_id = b.id
       ${where}
       ORDER BY c.score DESC, c.updated_at DESC`,
      values
    );

    // Build CSV
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "No candidates to export" }, { status: 404 });
    }

    const headers = Object.keys(result.rows[0]);
    const csvRows = [
      headers.join(","),
      ...result.rows.map((row: Record<string, unknown>) =>
        headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",")
      ),
    ];

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=staffradar-candidates-${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  } finally {
    await db.end();
  }
}
