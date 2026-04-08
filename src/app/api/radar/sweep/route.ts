import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { advancedScoreCandidate } from "@/lib/sweep";
import type { Building, Candidate } from "@/lib/types";

// Full Radar Sweep: scan NPI for all priority roles near a building,
// import results, score them, and return a complete intelligence report
export async function POST(req: NextRequest) {
  const { building_id, roles } = await req.json();

  if (!building_id) {
    return NextResponse.json({ error: "building_id required" }, { status: 400 });
  }

  const db = getDb();
  try {
    // Get building
    const bRes = await db.query("SELECT * FROM buildings WHERE id = $1", [building_id]);
    if (bRes.rows.length === 0) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }
    const building = bRes.rows[0] as Building;

    const sweepRoles = roles || ["RN", "CNA", "LPN", "Med Tech"];
    const results: Record<string, unknown> = {};
    let totalFound = 0;
    let totalImported = 0;
    let totalSkipped = 0;

    // Scan NPI for each role
    for (const role of sweepRoles) {
      const taxonomyMap: Record<string, string> = {
        RN: "Registered Nurse",
        LPN: "Licensed Practical Nurse",
        CNA: "Nurse Aide",
        "Med Tech": "Medical Technologist",
      };
      const taxonomy = taxonomyMap[role] || role;

      const params = new URLSearchParams({
        version: "2.1",
        enumeration_type: "NPI-1",
        taxonomy_description: taxonomy,
        state: building.state,
        city: building.city,
        limit: "100",
      });

      try {
        const npiRes = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params.toString()}`);
        const npiData = await npiRes.json();

        if (npiData.results) {
          let roleImported = 0;
          let roleSkipped = 0;

          for (const r of npiData.results) {
            const basic = r.basic || {};
            const addresses = r.addresses || [];
            const taxonomies = r.taxonomies || [];
            const practiceAddr = addresses.find((a: Record<string, string>) => a.address_purpose === "LOCATION") || addresses[0] || {};
            const primaryTax = taxonomies.find((t: Record<string, unknown>) => t.primary) || taxonomies[0] || {};

            // Check for existing
            const existing = await db.query("SELECT id FROM candidates WHERE npi = $1", [r.number]);
            if (existing.rows.length > 0) {
              roleSkipped++;
              continue;
            }

            // Build candidate for scoring
            const candidateData = {
              npi: r.number,
              first_name: basic.first_name || "",
              last_name: basic.last_name || "",
              credentials: basic.credential || "",
              role_type: role,
              specialty: primaryTax.desc || "",
              phone: practiceAddr.telephone_number || "",
              address: practiceAddr.address_1 || "",
              city: practiceAddr.city || "",
              state: practiceAddr.state || "",
              zip: practiceAddr.postal_code || "",
              license_state: primaryTax.state || "",
              license_number: primaryTax.license || "",
              source: "radar_sweep",
              source_detail: `Sweep: ${building.name} - ${role}`,
              building_id: building.id,
              is_traveler: false,
              willingness_to_relocate: false,
              status: "discovered" as const,
              created_at: new Date().toISOString(),
            };

            // Advanced score
            const score = advancedScoreCandidate(candidateData as Partial<Candidate>, building);

            // Import with score
            await db.query(
              `INSERT INTO candidates (npi, first_name, last_name, credentials, role_type, specialty,
                phone, address, city, state, zip, source, source_detail,
                building_id, license_state, license_number, score)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
              [
                candidateData.npi, candidateData.first_name, candidateData.last_name,
                candidateData.credentials, role, candidateData.specialty,
                candidateData.phone, candidateData.address, candidateData.city,
                candidateData.state, candidateData.zip, "radar_sweep",
                candidateData.source_detail, building.id,
                candidateData.license_state, candidateData.license_number, score.total,
              ]
            );
            roleImported++;
          }

          results[role] = {
            found: npiData.result_count || npiData.results.length,
            imported: roleImported,
            skipped: roleSkipped,
          };
          totalFound += npiData.result_count || npiData.results.length;
          totalImported += roleImported;
          totalSkipped += roleSkipped;
        }
      } catch (err) {
        results[role] = { error: String(err), found: 0, imported: 0, skipped: 0 };
      }
    }

    // Get top scored candidates from this sweep
    const topCandidates = await db.query(
      `SELECT * FROM candidates
       WHERE building_id = $1 AND source = 'radar_sweep'
       ORDER BY score DESC LIMIT 20`,
      [building.id]
    );

    // Score breakdown for top candidates
    const hotLeads = topCandidates.rows.filter((c: Candidate) => c.score >= 70);
    const strongProspects = topCandidates.rows.filter((c: Candidate) => c.score >= 50 && c.score < 70);

    // Log the sweep
    await db.query(
      `INSERT INTO activity_log (building_id, action, details)
       VALUES ($1, $2, $3)`,
      [building.id, "radar_sweep", JSON.stringify({
        roles: sweepRoles, totalFound, totalImported, totalSkipped,
        hotLeads: hotLeads.length, strongProspects: strongProspects.length,
      })]
    );

    return NextResponse.json({
      building: { name: building.name, city: building.city, state: building.state, type: building.type },
      sweep_results: results,
      summary: {
        total_found: totalFound,
        total_imported: totalImported,
        total_skipped: totalSkipped,
        hot_leads: hotLeads.length,
        strong_prospects: strongProspects.length,
      },
      top_candidates: topCandidates.rows.slice(0, 10).map((c: Candidate) => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        role: c.role_type,
        score: c.score,
        city: c.city,
        state: c.state,
        phone: c.phone,
        npi: c.npi,
      })),
    });
  } finally {
    await db.end();
  }
}
