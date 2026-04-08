import { NextRequest, NextResponse } from "next/server";
import type { NpiSearchParams, NPI_TAXONOMY_MAP } from "@/lib/types";

const TAXONOMY_MAP: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Nurse Aide",
  "Med Tech": "Medical Technologist",
  "Physical Therapist": "Physical Therapist",
  "Occupational Therapist": "Occupational Therapist",
  "Speech Therapist": "Speech-Language Pathologist",
  "Social Worker": "Social Worker",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roleType = searchParams.get("role_type");
  const state = searchParams.get("state");
  const city = searchParams.get("city");
  const postalCode = searchParams.get("postal_code");
  const firstName = searchParams.get("first_name");
  const lastName = searchParams.get("last_name");
  const limit = searchParams.get("limit") || "50";
  const skip = searchParams.get("skip") || "0";

  const params = new URLSearchParams({
    version: "2.1",
    enumeration_type: "NPI-1",
    limit,
    skip,
  });

  if (roleType && TAXONOMY_MAP[roleType]) {
    params.set("taxonomy_description", TAXONOMY_MAP[roleType]);
  } else if (roleType) {
    params.set("taxonomy_description", roleType);
  }

  if (state) params.set("state", state);
  if (city) params.set("city", city);
  if (postalCode) params.set("postal_code", postalCode.substring(0, 5) + "*");
  if (firstName) params.set("first_name", firstName + "*");
  if (lastName) params.set("last_name", lastName + "*");

  try {
    const npiUrl = `https://npiregistry.cms.hhs.gov/api/?${params.toString()}`;
    const response = await fetch(npiUrl, { next: { revalidate: 3600 } });
    const data = await response.json();

    if (data.Errors) {
      return NextResponse.json({ results: [], total: 0, errors: data.Errors });
    }

    const results = (data.results || []).map((r: Record<string, unknown>) => {
      const basic = r.basic as Record<string, string>;
      const addresses = r.addresses as Array<Record<string, string>>;
      const taxonomies = r.taxonomies as Array<Record<string, unknown>>;
      const practiceAddr = addresses?.find((a) => a.address_purpose === "LOCATION") || addresses?.[0];
      const primaryTax = taxonomies?.find((t) => t.primary) || taxonomies?.[0];

      return {
        npi: r.number,
        first_name: basic?.first_name || "",
        last_name: basic?.last_name || "",
        credential: basic?.credential || "",
        gender: basic?.gender || "",
        enumeration_date: basic?.enumeration_date || "",
        last_updated: basic?.last_updated || "",
        address: practiceAddr?.address_1 || "",
        city: practiceAddr?.city || "",
        state: practiceAddr?.state || "",
        zip: practiceAddr?.postal_code || "",
        phone: practiceAddr?.telephone_number || "",
        taxonomy_desc: primaryTax?.desc || "",
        taxonomy_code: primaryTax?.code || "",
        license_state: primaryTax?.state || "",
        license_number: primaryTax?.license || "",
      };
    });

    return NextResponse.json({
      results,
      total: data.result_count || 0,
    });
  } catch (error) {
    console.error("NPI API error:", error);
    return NextResponse.json({ error: "Failed to search NPI registry" }, { status: 500 });
  }
}
