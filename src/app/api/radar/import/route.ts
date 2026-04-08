import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Import NPI results into candidates pipeline
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

    for (const c of candidates) {
      try {
        // Check for existing NPI
        if (c.npi) {
          const existing = await db.query("SELECT id FROM candidates WHERE npi = $1", [c.npi]);
          if (existing.rows.length > 0) {
            skipped++;
            continue;
          }
        }

        await db.query(
          `INSERT INTO candidates (npi, first_name, last_name, credentials, role_type, specialty,
            phone, address, city, state, zip, source, source_detail,
            building_id, license_state, license_number)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            c.npi, c.first_name, c.last_name, c.credential || c.credentials,
            c.role_type || "RN", c.taxonomy_desc || c.specialty,
            c.phone, c.address, c.city, c.state, c.zip,
            "npi_registry", `NPI: ${c.npi}`,
            building_id || null, c.license_state, c.license_number,
          ]
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
