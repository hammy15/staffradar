import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { scoreCandidate } from "@/lib/scoring";
import type { Candidate, Building } from "@/lib/types";

// Import NPI results into candidates pipeline with auto-scoring
export async function POST(req: NextRequest) {
  const { candidates, building_id } = await req.json();

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return NextResponse.json({ error: "No candidates to import" }, { status: 400 });
  }

  const db = getDb();
  try {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Get building for scoring
    let building: Building | null = null;
    if (building_id) {
      const bRes = await db.query("SELECT * FROM buildings WHERE id = $1", [building_id]);
      building = bRes.rows[0] || null;
    }

    for (const c of candidates) {
      try {
        if (c.npi) {
          const existing = await db.query("SELECT id FROM candidates WHERE npi = $1", [c.npi]);
          if (existing.rows.length > 0) {
            skipped++;
            continue;
          }
        }

        // Build a partial candidate for scoring
        const partialCandidate = {
          state: c.state,
          city: c.city,
          role_type: c.role_type || "RN",
          license_state: c.license_state,
          is_traveler: false,
          willingness_to_relocate: false,
          status: "discovered",
          created_at: new Date().toISOString(),
        } as Candidate;

        const score = scoreCandidate(partialCandidate, building);

        const result = await db.query(
          `INSERT INTO candidates (npi, first_name, last_name, credentials, role_type, specialty,
            phone, address, city, state, zip, source, source_detail,
            building_id, license_state, license_number, score)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           RETURNING id`,
          [
            c.npi, c.first_name, c.last_name, c.credential || c.credentials,
            c.role_type || "RN", c.taxonomy_desc || c.specialty,
            c.phone, c.address, c.city, c.state, c.zip,
            "npi_registry", `NPI: ${c.npi}`,
            building_id || null, c.license_state, c.license_number, score.total,
          ]
        );

        // Log the import activity
        await db.query(
          `INSERT INTO activity_log (candidate_id, building_id, action, details)
           VALUES ($1, $2, $3, $4)`,
          [result.rows[0].id, building_id || null, "imported",
           JSON.stringify({ source: "npi_registry", npi: c.npi, score: score.total })]
        );

        imported++;
      } catch (err) {
        errors.push(`Failed to import ${c.first_name} ${c.last_name}: ${err}`);
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } finally {
    await db.end();
  }
}
