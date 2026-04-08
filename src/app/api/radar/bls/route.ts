import { NextRequest, NextResponse } from "next/server";

// BLS OES data for healthcare occupations
// SOC codes: 29-1141 (RN), 31-1131 (Nursing Assistant), 29-2061 (LPN), 29-2010 (Clinical Lab)
const OES_CODES: Record<string, { soc: string; title: string }> = {
  RN: { soc: "29-1141", title: "Registered Nurses" },
  CNA: { soc: "31-1131", title: "Nursing Assistants" },
  LPN: { soc: "29-2061", title: "Licensed Practical & Vocational Nurses" },
  "Med Tech": { soc: "29-2010", title: "Clinical Laboratory Technologists & Technicians" },
  "Physical Therapist": { soc: "29-1123", title: "Physical Therapists" },
  "Occupational Therapist": { soc: "29-1122", title: "Occupational Therapists" },
  "Speech Therapist": { soc: "29-1127", title: "Speech-Language Pathologists" },
  Cook: { soc: "35-2012", title: "Cooks, Institution & Cafeteria" },
  "Dietary Aid": { soc: "35-3041", title: "Food Servers, Nonrestaurant" },
  "Social Worker": { soc: "21-1022", title: "Healthcare Social Workers" },
};

// State-level workforce estimates (BLS OES May 2023 data approximations)
// employment per 1000 jobs
const STATE_WORKFORCE_DENSITY: Record<string, Record<string, { per_1000: number; total: number; avg_salary: number }>> = {
  TX: {
    RN: { per_1000: 18.2, total: 226500, avg_salary: 79120 },
    CNA: { per_1000: 12.5, total: 155300, avg_salary: 31890 },
    LPN: { per_1000: 5.8, total: 72100, avg_salary: 52340 },
  },
  CA: {
    RN: { per_1000: 19.8, total: 328700, avg_salary: 133340 },
    CNA: { per_1000: 7.4, total: 122800, avg_salary: 40400 },
    LPN: { per_1000: 3.1, total: 51400, avg_salary: 64090 },
  },
  FL: {
    RN: { per_1000: 18.9, total: 181200, avg_salary: 73370 },
    CNA: { per_1000: 14.8, total: 141900, avg_salary: 32440 },
    LPN: { per_1000: 7.2, total: 69000, avg_salary: 48020 },
  },
  NY: {
    RN: { per_1000: 22.1, total: 208700, avg_salary: 98850 },
    CNA: { per_1000: 16.3, total: 153800, avg_salary: 40130 },
    LPN: { per_1000: 5.9, total: 55700, avg_salary: 55370 },
  },
  PA: {
    RN: { per_1000: 21.5, total: 133400, avg_salary: 77200 },
    CNA: { per_1000: 16.8, total: 104200, avg_salary: 35530 },
    LPN: { per_1000: 7.1, total: 44000, avg_salary: 51840 },
  },
  OH: {
    RN: { per_1000: 20.8, total: 119800, avg_salary: 72090 },
    CNA: { per_1000: 17.2, total: 99000, avg_salary: 33390 },
    LPN: { per_1000: 7.5, total: 43200, avg_salary: 49480 },
  },
  IL: {
    RN: { per_1000: 18.4, total: 114100, avg_salary: 78500 },
    CNA: { per_1000: 14.1, total: 87500, avg_salary: 35250 },
    LPN: { per_1000: 4.2, total: 26000, avg_salary: 53400 },
  },
  GA: {
    RN: { per_1000: 16.5, total: 80200, avg_salary: 75550 },
    CNA: { per_1000: 12.8, total: 62200, avg_salary: 30820 },
    LPN: { per_1000: 5.4, total: 26200, avg_salary: 47870 },
  },
  NC: {
    RN: { per_1000: 17.8, total: 87600, avg_salary: 72620 },
    CNA: { per_1000: 14.5, total: 71300, avg_salary: 31270 },
    LPN: { per_1000: 5.1, total: 25100, avg_salary: 49590 },
  },
  MI: {
    RN: { per_1000: 20.2, total: 92400, avg_salary: 76470 },
    CNA: { per_1000: 15.8, total: 72200, avg_salary: 35870 },
    LPN: { per_1000: 5.5, total: 25200, avg_salary: 52890 },
  },
  NJ: {
    RN: { per_1000: 21.3, total: 91800, avg_salary: 93000 },
    CNA: { per_1000: 14.2, total: 61200, avg_salary: 37200 },
    LPN: { per_1000: 4.8, total: 20700, avg_salary: 56800 },
  },
  VA: {
    RN: { per_1000: 17.1, total: 70400, avg_salary: 78200 },
    CNA: { per_1000: 12.9, total: 53100, avg_salary: 32500 },
    LPN: { per_1000: 5.0, total: 20600, avg_salary: 49700 },
  },
  WA: {
    RN: { per_1000: 19.5, total: 68200, avg_salary: 100670 },
    CNA: { per_1000: 10.2, total: 35700, avg_salary: 40900 },
    LPN: { per_1000: 3.8, total: 13300, avg_salary: 62400 },
  },
  AZ: {
    RN: { per_1000: 16.2, total: 52800, avg_salary: 81400 },
    CNA: { per_1000: 11.5, total: 37500, avg_salary: 36200 },
    LPN: { per_1000: 4.1, total: 13400, avg_salary: 55600 },
  },
  TN: {
    RN: { per_1000: 18.7, total: 61200, avg_salary: 68300 },
    CNA: { per_1000: 15.5, total: 50700, avg_salary: 30400 },
    LPN: { per_1000: 6.8, total: 22200, avg_salary: 45600 },
  },
  MO: {
    RN: { per_1000: 19.4, total: 59100, avg_salary: 68900 },
    CNA: { per_1000: 16.1, total: 49000, avg_salary: 30800 },
    LPN: { per_1000: 6.5, total: 19800, avg_salary: 47200 },
  },
  IN: {
    RN: { per_1000: 19.1, total: 62800, avg_salary: 70200 },
    CNA: { per_1000: 16.5, total: 54200, avg_salary: 32100 },
    LPN: { per_1000: 5.8, total: 19100, avg_salary: 49800 },
  },
  MA: {
    RN: { per_1000: 23.8, total: 88600, avg_salary: 99500 },
    CNA: { per_1000: 13.4, total: 49900, avg_salary: 39800 },
    LPN: { per_1000: 4.5, total: 16700, avg_salary: 60100 },
  },
  WI: {
    RN: { per_1000: 20.5, total: 62500, avg_salary: 74300 },
    CNA: { per_1000: 16.8, total: 51200, avg_salary: 35200 },
    LPN: { per_1000: 4.2, total: 12800, avg_salary: 50100 },
  },
  MN: {
    RN: { per_1000: 21.2, total: 63800, avg_salary: 82400 },
    CNA: { per_1000: 15.4, total: 46300, avg_salary: 37100 },
    LPN: { per_1000: 5.1, total: 15300, avg_salary: 51200 },
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state")?.toUpperCase();
  const roleType = searchParams.get("role_type");

  if (!state) {
    return NextResponse.json({ error: "State is required" }, { status: 400 });
  }

  const stateData = STATE_WORKFORCE_DENSITY[state];
  const oesInfo = roleType ? OES_CODES[roleType] : null;

  if (!stateData) {
    // Return generic message for states without data
    return NextResponse.json({
      state,
      available: false,
      message: `Detailed workforce data for ${state} not available in current dataset. Use BLS.gov for complete data.`,
      bls_link: `https://www.bls.gov/oes/current/oes_${state.toLowerCase()}.htm`,
    });
  }

  if (roleType && stateData[roleType]) {
    const data = stateData[roleType];
    return NextResponse.json({
      state,
      available: true,
      role: roleType,
      soc_code: oesInfo?.soc,
      soc_title: oesInfo?.title,
      ...data,
      interpretation: data.per_1000 > 18
        ? "High density — competitive market, many candidates but also many employers"
        : data.per_1000 > 12
        ? "Moderate density — balanced supply and demand"
        : "Low density — scarce workforce, may need relocation incentives",
    });
  }

  // Return all roles for the state
  const roles = Object.entries(stateData).map(([role, data]) => ({
    role,
    soc_code: OES_CODES[role]?.soc,
    soc_title: OES_CODES[role]?.title,
    ...data,
  }));

  return NextResponse.json({
    state,
    available: true,
    roles,
    bls_link: `https://www.bls.gov/oes/current/oes_${state.toLowerCase()}.htm`,
  });
}
