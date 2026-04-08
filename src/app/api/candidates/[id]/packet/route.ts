import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { advancedScoreCandidate, generateOutreachPacket } from "@/lib/sweep";
import type { Building, Candidate } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  try {
    const cRes = await db.query(
      `SELECT c.*, b.name as building_name, b.type as building_type,
              b.city as building_city, b.state as building_state, b.zip as building_zip,
              b.phone as building_phone
       FROM candidates c LEFT JOIN buildings b ON c.building_id = b.id
       WHERE c.id = $1`,
      [id]
    );

    if (cRes.rows.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const candidate = cRes.rows[0];
    if (!candidate.building_id) {
      return NextResponse.json({ error: "Candidate not assigned to a building" }, { status: 400 });
    }

    const building = {
      id: candidate.building_id,
      name: candidate.building_name,
      type: candidate.building_type,
      city: candidate.building_city,
      state: candidate.building_state,
      zip: candidate.building_zip,
      phone: candidate.building_phone,
    } as Building;

    const score = advancedScoreCandidate(candidate as Partial<Candidate>, building);
    const packet = generateOutreachPacket(candidate as Partial<Candidate>, building, score);

    return new NextResponse(packet, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename=staffradar-packet-${candidate.first_name}-${candidate.last_name}.txt`,
      },
    });
  } finally {
    await db.end();
  }
}
