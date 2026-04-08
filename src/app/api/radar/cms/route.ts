import { NextRequest, NextResponse } from "next/server";

// CMS Nursing Home Compare API
// Datasets: https://data.cms.gov/provider-data/
const CMS_NH_URL = "https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state");
  const city = searchParams.get("city");
  const zip = searchParams.get("zip");

  if (!state) {
    return NextResponse.json({ error: "State is required" }, { status: 400 });
  }

  try {
    // Build CMS API query
    const conditions: Array<{ property: string; value: string; operator?: string }> = [
      { property: "provider_state", value: state },
    ];

    if (city) {
      conditions.push({ property: "provider_city", value: city.toUpperCase() });
    }
    if (zip) {
      conditions.push({ property: "provider_zip_code", value: zip.substring(0, 5), operator: "STARTS_WITH" });
    }

    const body = {
      conditions,
      limit: 100,
      offset: 0,
      sort: { property: "overall_rating", order: "ASC" },
    };

    const response = await fetch(CMS_NH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 86400 }, // cache 24hrs
    });

    if (!response.ok) {
      // Fallback: try alternate dataset
      return NextResponse.json({ facilities: [], total: 0, note: "CMS API temporarily unavailable" });
    }

    const data = await response.json();
    const facilities = (data.results || []).map((f: Record<string, string>) => ({
      cms_id: f.federal_provider_number || f.provider_id,
      name: f.provider_name || "",
      address: f.provider_address || "",
      city: f.provider_city || "",
      state: f.provider_state || "",
      zip: f.provider_zip_code || "",
      phone: f.provider_phone_number || "",
      overall_rating: parseInt(f.overall_rating) || null,
      staffing_rating: parseInt(f.staffing_rating) || null,
      rn_staffing_hours: parseFloat(f.reported_nurse_aide_staffing_hours_per_resident_per_day) || null,
      total_beds: parseInt(f.number_of_certified_beds) || null,
      occupancy_rate: parseInt(f.average_number_of_residents_per_day)
        ? (parseInt(f.average_number_of_residents_per_day) / parseInt(f.number_of_certified_beds)) * 100
        : null,
      ownership_type: f.ownership_type || "",
      abuse_icon: f.abuse_icon || "",
      total_penalties_count: f.total_number_of_penalties || "0",
    }));

    return NextResponse.json({
      facilities,
      total: data.count || facilities.length,
    });
  } catch (error) {
    console.error("CMS API error:", error);
    return NextResponse.json({ facilities: [], total: 0, error: "CMS API error" });
  }
}
