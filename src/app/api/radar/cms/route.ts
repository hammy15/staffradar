import { NextRequest, NextResponse } from "next/server";

// CMS Nursing Home Compare — Provider Data API
// Dataset: 4pq5-n9py (Provider Information)
const CMS_URL = "https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state");
  const city = searchParams.get("city");
  const zip = searchParams.get("zip");

  if (!state) {
    return NextResponse.json({ error: "State is required" }, { status: 400 });
  }

  try {
    const conditions: Array<{ property: string; value: string; operator?: string }> = [
      { property: "state", value: state.toUpperCase() },
    ];

    if (city) {
      conditions.push({ property: "citytown", value: city.toUpperCase() });
    }
    if (zip) {
      conditions.push({ property: "zip_code", value: zip.substring(0, 5), operator: "STARTS_WITH" });
    }

    const body = {
      conditions,
      limit: 100,
      offset: 0,
      sort: { property: "overall_rating", order: "ASC" },
    };

    const response = await fetch(CMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("CMS API error:", response.status, errText);
      return NextResponse.json({ facilities: [], total: 0, error: `CMS API returned ${response.status}` });
    }

    const data = await response.json();
    const facilities = (data.results || []).map((f: Record<string, string>) => ({
      cms_id: f.cms_certification_number_ccn || "",
      name: f.provider_name || "",
      address: f.provider_address || "",
      city: f.citytown || "",
      state: f.state || "",
      zip: f.zip_code || "",
      phone: f.telephone_number || "",
      overall_rating: parseInt(f.overall_rating) || null,
      staffing_rating: parseInt(f.staffing_rating) || null,
      rn_staffing_hours: parseFloat(f.reported_rn_staffing_hours_per_resident_per_day) || null,
      total_nurse_staffing_hours: parseFloat(f.reported_total_nurse_staffing_hours_per_resident_per_day) || null,
      aide_staffing_hours: parseFloat(f.reported_nurse_aide_staffing_hours_per_resident_per_day) || null,
      total_beds: parseInt(f.number_of_certified_beds) || null,
      occupancy_rate: f.average_number_of_residents_per_day && f.number_of_certified_beds
        ? Math.round((parseInt(f.average_number_of_residents_per_day) / parseInt(f.number_of_certified_beds)) * 100)
        : null,
      ownership_type: f.ownership_type || "",
      total_penalties_count: f.total_number_of_penalties || "0",
      rn_turnover: f.registered_nurse_turnover || null,
      total_turnover: f.total_nursing_staff_turnover || null,
      chain_name: f.chain_name || null,
    }));

    return NextResponse.json({
      facilities,
      total: data.count || facilities.length,
      source: "CMS Care Compare — Provider Information",
    });
  } catch (error) {
    console.error("CMS API error:", error);
    return NextResponse.json({ facilities: [], total: 0, error: "CMS API connection error" });
  }
}
