import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { advancedScoreCandidate } from "@/lib/sweep";
import type { Building, Candidate } from "@/lib/types";

// Nearby cities for rural areas — expand search radius
const NEARBY_CITIES: Record<string, string[]> = {
  // Idaho
  "Emmett": ["Boise", "Nampa", "Caldwell", "Eagle", "Meridian"],
  "Orofino": ["Lewiston", "Moscow", "Grangeville"],
  "Kellogg": ["Coeur d'Alene", "Post Falls", "Wallace"],
  "Bellevue": ["Twin Falls", "Hailey", "Ketchum", "Sun Valley"],
  "Payette": ["Nampa", "Caldwell", "Ontario"],
  "Weiser": ["Payette", "Ontario", "Caldwell"],
  "Silverton": ["Kellogg", "Wallace", "Coeur d'Alene"],
  // Washington
  "Colfax": ["Pullman", "Moscow", "Spokane"],
  "Colville": ["Spokane", "Chewelah", "Kettle Falls"],
  "Blaine": ["Bellingham", "Lynden", "Ferndale"],
  "Battle Ground": ["Vancouver", "Portland", "Camas"],
  "Clarkston": ["Lewiston", "Moscow", "Pullman"],
  "Anacortes": ["Burlington", "Mount Vernon", "Bellingham"],
  // Oregon
  "Brookings": ["Gold Beach", "Crescent City", "Medford"],
  "Wood Village": ["Gresham", "Portland", "Troutdale"],
  // Montana
  "Libby": ["Kalispell", "Eureka", "Troy"],
  "Eureka": ["Kalispell", "Whitefish", "Libby"],
  // Arizona
  "Sun City": ["Phoenix", "Glendale", "Peoria", "Surprise"],
};

export async function POST(req: NextRequest) {
  const { building_id, roles } = await req.json();

  if (!building_id) {
    return NextResponse.json({ error: "building_id required" }, { status: 400 });
  }

  const db = getDb();
  try {
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

    const taxonomyMap: Record<string, string> = {
      RN: "Registered Nurse",
      LPN: "Licensed Practical Nurse",
      CNA: "Nurse Aide",
      "Med Tech": "Medical Technologist",
      "Physical Therapist": "Physical Therapist",
      "Occupational Therapist": "Occupational Therapist",
      "Speech Therapist": "Speech-Language Pathologist",
      "Social Worker": "Social Worker",
    };

    for (const role of sweepRoles) {
      const taxonomy = taxonomyMap[role] || role;

      // Build list of cities to search: primary + nearby + state-wide fallback
      const citiesToSearch = [building.city];
      const nearby = NEARBY_CITIES[building.city];
      if (nearby) citiesToSearch.push(...nearby);

      let allNpiResults: Record<string, unknown>[] = [];

      for (const searchCity of citiesToSearch) {
        const params = new URLSearchParams({
          version: "2.1",
          enumeration_type: "NPI-1",
          taxonomy_description: taxonomy,
          state: building.state,
          city: searchCity,
          limit: "200",
        });

        try {
          const npiRes = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params.toString()}`);
          const npiData = await npiRes.json();
          if (npiData.results) {
            allNpiResults.push(...npiData.results);
          }
        } catch {
          // Continue with other cities
        }

        // If we have enough results, stop expanding
        if (allNpiResults.length >= 100) break;
      }

      // If still thin, do a state-wide search (no city filter)
      if (allNpiResults.length < 20) {
        try {
          const stateParams = new URLSearchParams({
            version: "2.1",
            enumeration_type: "NPI-1",
            taxonomy_description: taxonomy,
            state: building.state,
            limit: "200",
          });
          const stateRes = await fetch(`https://npiregistry.cms.hhs.gov/api/?${stateParams.toString()}`);
          const stateData = await stateRes.json();
          if (stateData.results) {
            // Add state results that aren't duplicates
            const existingNpis = new Set(allNpiResults.map((r: Record<string, unknown>) => r.number));
            for (const r of stateData.results) {
              if (!existingNpis.has(r.number)) {
                allNpiResults.push(r);
              }
            }
          }
        } catch {
          // OK
        }
      }

      // Deduplicate by NPI
      const seenNpis = new Set<string>();
      allNpiResults = allNpiResults.filter((r: Record<string, unknown>) => {
        if (seenNpis.has(r.number as string)) return false;
        seenNpis.add(r.number as string);
        return true;
      });

      let roleImported = 0;
      let roleSkipped = 0;

      for (const r of allNpiResults) {
        const basic = (r.basic || {}) as Record<string, string>;
        const addresses = (r.addresses || []) as Array<Record<string, string>>;
        const taxonomies = (r.taxonomies || []) as Array<Record<string, unknown>>;
        const practiceAddr = addresses.find((a) => a.address_purpose === "LOCATION") || addresses[0] || {};
        const primaryTax = taxonomies.find((t) => t.primary) || taxonomies[0] || {};

        // Check for existing
        const existing = await db.query("SELECT id FROM candidates WHERE npi = $1", [r.number]);
        if (existing.rows.length > 0) {
          roleSkipped++;
          continue;
        }

        const candidateData = {
          state: practiceAddr.state || building.state,
          city: practiceAddr.city || "",
          role_type: role,
          license_state: (primaryTax.state as string) || "",
          is_traveler: false,
          willingness_to_relocate: false,
          status: "discovered" as const,
          created_at: new Date().toISOString(),
        } as Partial<Candidate>;

        const score = advancedScoreCandidate(candidateData, building);

        await db.query(
          `INSERT INTO candidates (npi, first_name, last_name, credentials, role_type, specialty,
            phone, address, city, state, zip, source, source_detail,
            building_id, license_state, license_number, score)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [
            r.number, basic.first_name, basic.last_name,
            basic.credential, role, (primaryTax.desc as string) || "",
            practiceAddr.telephone_number, practiceAddr.address_1,
            practiceAddr.city, practiceAddr.state, practiceAddr.postal_code,
            "radar_sweep", `Sweep: ${building.name} - ${role}`,
            building.id, (primaryTax.state as string) || "", (primaryTax.license as string) || "",
            score.total,
          ]
        );

        await db.query(
          `INSERT INTO activity_log (candidate_id, building_id, action, details) VALUES (
            (SELECT id FROM candidates WHERE npi = $1 LIMIT 1), $2, $3, $4)`,
          [r.number, building.id, "imported",
           JSON.stringify({ source: "radar_sweep", npi: r.number, score: score.total })]
        );

        roleImported++;
      }

      results[role] = {
        found: allNpiResults.length,
        imported: roleImported,
        skipped: roleSkipped,
      };
      totalFound += allNpiResults.length;
      totalImported += roleImported;
      totalSkipped += roleSkipped;
    }

    // Get ALL top candidates for this building (not just from this sweep)
    const topCandidates = await db.query(
      `SELECT * FROM candidates
       WHERE building_id = $1
       ORDER BY score DESC LIMIT 20`,
      [building.id]
    );

    const hotLeads = topCandidates.rows.filter((c: Candidate) => c.score >= 70);
    const strongProspects = topCandidates.rows.filter((c: Candidate) => c.score >= 50 && c.score < 70);

    await db.query(
      `INSERT INTO activity_log (building_id, action, details) VALUES ($1, $2, $3)`,
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
