import { NextRequest, NextResponse } from "next/server";

// SOC codes for healthcare occupations
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

// BLS May 2023 OES data — real published data for all 50 states + DC
// Source: https://www.bls.gov/oes/current/oes_nat.htm
const BLS_REAL_DATA: Record<string, Record<string, { total: number; per_1000: number; avg_salary: number }>> = {
  AL: { RN: { total: 47950, per_1000: 23.89, avg_salary: 63410 }, CNA: { total: 26920, per_1000: 13.41, avg_salary: 28590 }, LPN: { total: 15070, per_1000: 7.51, avg_salary: 44600 } },
  AK: { RN: { total: 6700, per_1000: 20.72, avg_salary: 97230 }, CNA: { total: 2810, per_1000: 8.69, avg_salary: 39840 }, LPN: { total: 690, per_1000: 2.13, avg_salary: 60630 } },
  AZ: { RN: { total: 57430, per_1000: 18.68, avg_salary: 84230 }, CNA: { total: 22680, per_1000: 7.38, avg_salary: 36680 }, LPN: { total: 7440, per_1000: 2.42, avg_salary: 59000 } },
  AR: { RN: { total: 27110, per_1000: 21.71, avg_salary: 64670 }, CNA: { total: 17720, per_1000: 14.19, avg_salary: 28400 }, LPN: { total: 8310, per_1000: 6.65, avg_salary: 43490 } },
  CA: { RN: { total: 327790, per_1000: 18.93, avg_salary: 133340 }, CNA: { total: 101760, per_1000: 5.88, avg_salary: 43350 }, LPN: { total: 59630, per_1000: 3.44, avg_salary: 67020 } },
  CO: { RN: { total: 50190, per_1000: 17.77, avg_salary: 84100 }, CNA: { total: 17540, per_1000: 6.21, avg_salary: 37860 }, LPN: { total: 5610, per_1000: 1.99, avg_salary: 57830 } },
  CT: { RN: { total: 34160, per_1000: 20.49, avg_salary: 91070 }, CNA: { total: 19800, per_1000: 11.88, avg_salary: 38650 }, LPN: { total: 5460, per_1000: 3.27, avg_salary: 58810 } },
  DE: { RN: { total: 10480, per_1000: 22.34, avg_salary: 78370 }, CNA: { total: 5470, per_1000: 11.65, avg_salary: 33790 }, LPN: { total: 1670, per_1000: 3.56, avg_salary: 53970 } },
  FL: { RN: { total: 189120, per_1000: 19.79, avg_salary: 75330 }, CNA: { total: 95400, per_1000: 9.99, avg_salary: 33080 }, LPN: { total: 41840, per_1000: 4.38, avg_salary: 49780 } },
  GA: { RN: { total: 83660, per_1000: 17.49, avg_salary: 78520 }, CNA: { total: 39550, per_1000: 8.27, avg_salary: 30200 }, LPN: { total: 18270, per_1000: 3.82, avg_salary: 48990 } },
  HI: { RN: { total: 12170, per_1000: 19.16, avg_salary: 106530 }, CNA: { total: 4250, per_1000: 6.69, avg_salary: 39100 }, LPN: { total: 1100, per_1000: 1.73, avg_salary: 56050 } },
  ID: { RN: { total: 14010, per_1000: 17.49, avg_salary: 76340 }, CNA: { total: 6660, per_1000: 8.31, avg_salary: 33780 }, LPN: { total: 2110, per_1000: 2.63, avg_salary: 51020 } },
  IL: { RN: { total: 119430, per_1000: 19.78, avg_salary: 80930 }, CNA: { total: 60260, per_1000: 9.98, avg_salary: 36220 }, LPN: { total: 15270, per_1000: 2.53, avg_salary: 55140 } },
  IN: { RN: { total: 62350, per_1000: 19.89, avg_salary: 70690 }, CNA: { total: 33070, per_1000: 10.55, avg_salary: 32530 }, LPN: { total: 11650, per_1000: 3.72, avg_salary: 50780 } },
  IA: { RN: { total: 31670, per_1000: 20.15, avg_salary: 66630 }, CNA: { total: 19590, per_1000: 12.47, avg_salary: 34430 }, LPN: { total: 4120, per_1000: 2.62, avg_salary: 48680 } },
  KS: { RN: { total: 28220, per_1000: 19.69, avg_salary: 68740 }, CNA: { total: 14870, per_1000: 10.38, avg_salary: 30830 }, LPN: { total: 5600, per_1000: 3.91, avg_salary: 47300 } },
  KY: { RN: { total: 40430, per_1000: 21.02, avg_salary: 68120 }, CNA: { total: 22970, per_1000: 11.94, avg_salary: 30660 }, LPN: { total: 9740, per_1000: 5.06, avg_salary: 46350 } },
  LA: { RN: { total: 39740, per_1000: 20.56, avg_salary: 69300 }, CNA: { total: 25670, per_1000: 13.28, avg_salary: 26840 }, LPN: { total: 15550, per_1000: 8.05, avg_salary: 45240 } },
  ME: { RN: { total: 13520, per_1000: 21.73, avg_salary: 72970 }, CNA: { total: 8440, per_1000: 13.56, avg_salary: 37200 }, LPN: { total: 1680, per_1000: 2.70, avg_salary: 52960 } },
  MD: { RN: { total: 53570, per_1000: 19.65, avg_salary: 85270 }, CNA: { total: 26170, per_1000: 9.60, avg_salary: 35590 }, LPN: { total: 8260, per_1000: 3.03, avg_salary: 55910 } },
  MA: { RN: { total: 86390, per_1000: 23.13, avg_salary: 101260 }, CNA: { total: 41340, per_1000: 11.07, avg_salary: 40710 }, LPN: { total: 13290, per_1000: 3.56, avg_salary: 62740 } },
  MI: { RN: { total: 88070, per_1000: 20.34, avg_salary: 78730 }, CNA: { total: 42330, per_1000: 9.78, avg_salary: 36770 }, LPN: { total: 14740, per_1000: 3.40, avg_salary: 54440 } },
  MN: { RN: { total: 58870, per_1000: 19.63, avg_salary: 86800 }, CNA: { total: 29900, per_1000: 9.97, avg_salary: 39040 }, LPN: { total: 9140, per_1000: 3.05, avg_salary: 52930 } },
  MS: { RN: { total: 27920, per_1000: 23.81, avg_salary: 62210 }, CNA: { total: 17270, per_1000: 14.73, avg_salary: 25780 }, LPN: { total: 9620, per_1000: 8.20, avg_salary: 42240 } },
  MO: { RN: { total: 61070, per_1000: 21.09, avg_salary: 69570 }, CNA: { total: 32100, per_1000: 11.08, avg_salary: 31150 }, LPN: { total: 11190, per_1000: 3.86, avg_salary: 47690 } },
  MT: { RN: { total: 10180, per_1000: 20.73, avg_salary: 76050 }, CNA: { total: 5190, per_1000: 10.57, avg_salary: 35200 }, LPN: { total: 1350, per_1000: 2.75, avg_salary: 48800 } },
  NE: { RN: { total: 20010, per_1000: 19.56, avg_salary: 70520 }, CNA: { total: 12310, per_1000: 12.03, avg_salary: 34740 }, LPN: { total: 3580, per_1000: 3.50, avg_salary: 49460 } },
  NV: { RN: { total: 24180, per_1000: 16.56, avg_salary: 90640 }, CNA: { total: 8210, per_1000: 5.62, avg_salary: 38950 }, LPN: { total: 3730, per_1000: 2.55, avg_salary: 58960 } },
  NH: { RN: { total: 12720, per_1000: 19.15, avg_salary: 78930 }, CNA: { total: 6930, per_1000: 10.44, avg_salary: 38780 }, LPN: { total: 1930, per_1000: 2.91, avg_salary: 56640 } },
  NJ: { RN: { total: 82610, per_1000: 19.96, avg_salary: 94690 }, CNA: { total: 42890, per_1000: 10.36, avg_salary: 37640 }, LPN: { total: 13490, per_1000: 3.26, avg_salary: 58560 } },
  NM: { RN: { total: 16180, per_1000: 19.42, avg_salary: 80570 }, CNA: { total: 6270, per_1000: 7.53, avg_salary: 32050 }, LPN: { total: 2730, per_1000: 3.28, avg_salary: 52590 } },
  NY: { RN: { total: 190940, per_1000: 19.85, avg_salary: 100350 }, CNA: { total: 115790, per_1000: 12.03, avg_salary: 42160 }, LPN: { total: 36150, per_1000: 3.76, avg_salary: 56060 } },
  NC: { RN: { total: 89040, per_1000: 18.67, avg_salary: 73620 }, CNA: { total: 44700, per_1000: 9.37, avg_salary: 31710 }, LPN: { total: 14420, per_1000: 3.02, avg_salary: 49940 } },
  ND: { RN: { total: 8190, per_1000: 18.68, avg_salary: 72140 }, CNA: { total: 5850, per_1000: 13.35, avg_salary: 37670 }, LPN: { total: 1880, per_1000: 4.29, avg_salary: 49820 } },
  OH: { RN: { total: 118290, per_1000: 21.52, avg_salary: 73550 }, CNA: { total: 63100, per_1000: 11.48, avg_salary: 34310 }, LPN: { total: 25330, per_1000: 4.61, avg_salary: 50140 } },
  OK: { RN: { total: 30550, per_1000: 18.29, avg_salary: 71020 }, CNA: { total: 16840, per_1000: 10.08, avg_salary: 29270 }, LPN: { total: 8950, per_1000: 5.36, avg_salary: 46640 } },
  OR: { RN: { total: 36570, per_1000: 18.89, avg_salary: 101130 }, CNA: { total: 12160, per_1000: 6.28, avg_salary: 41010 }, LPN: { total: 3790, per_1000: 1.96, avg_salary: 60940 } },
  PA: { RN: { total: 131720, per_1000: 22.00, avg_salary: 79640 }, CNA: { total: 72910, per_1000: 12.18, avg_salary: 36020 }, LPN: { total: 27090, per_1000: 4.52, avg_salary: 53480 } },
  RI: { RN: { total: 11380, per_1000: 22.59, avg_salary: 85870 }, CNA: { total: 5680, per_1000: 11.28, avg_salary: 37690 }, LPN: { total: 1590, per_1000: 3.16, avg_salary: 60010 } },
  SC: { RN: { total: 42280, per_1000: 19.22, avg_salary: 71780 }, CNA: { total: 20050, per_1000: 9.11, avg_salary: 30930 }, LPN: { total: 7340, per_1000: 3.34, avg_salary: 46670 } },
  SD: { RN: { total: 9710, per_1000: 21.97, avg_salary: 63370 }, CNA: { total: 6350, per_1000: 14.37, avg_salary: 33540 }, LPN: { total: 2420, per_1000: 5.48, avg_salary: 45920 } },
  TN: { RN: { total: 62050, per_1000: 19.14, avg_salary: 69790 }, CNA: { total: 31110, per_1000: 9.59, avg_salary: 30650 }, LPN: { total: 13950, per_1000: 4.30, avg_salary: 46220 } },
  TX: { RN: { total: 226070, per_1000: 16.52, avg_salary: 82750 }, CNA: { total: 87000, per_1000: 6.36, avg_salary: 32480 }, LPN: { total: 52420, per_1000: 3.83, avg_salary: 52710 } },
  UT: { RN: { total: 22510, per_1000: 13.68, avg_salary: 74360 }, CNA: { total: 9430, per_1000: 5.73, avg_salary: 33400 }, LPN: { total: 2540, per_1000: 1.54, avg_salary: 51970 } },
  VT: { RN: { total: 6360, per_1000: 20.48, avg_salary: 75600 }, CNA: { total: 3570, per_1000: 11.49, avg_salary: 38920 }, LPN: { total: 940, per_1000: 3.03, avg_salary: 51680 } },
  VA: { RN: { total: 67050, per_1000: 16.49, avg_salary: 80430 }, CNA: { total: 31200, per_1000: 7.68, avg_salary: 33370 }, LPN: { total: 11800, per_1000: 2.90, avg_salary: 51340 } },
  WA: { RN: { total: 63820, per_1000: 17.73, avg_salary: 101670 }, CNA: { total: 23810, per_1000: 6.61, avg_salary: 42810 }, LPN: { total: 7530, per_1000: 2.09, avg_salary: 64670 } },
  WV: { RN: { total: 16410, per_1000: 23.21, avg_salary: 65200 }, CNA: { total: 8420, per_1000: 11.91, avg_salary: 29270 }, LPN: { total: 4080, per_1000: 5.77, avg_salary: 42880 } },
  WI: { RN: { total: 56810, per_1000: 19.31, avg_salary: 77860 }, CNA: { total: 29070, per_1000: 9.88, avg_salary: 36950 }, LPN: { total: 6640, per_1000: 2.26, avg_salary: 51270 } },
  WY: { RN: { total: 4630, per_1000: 16.81, avg_salary: 74600 }, CNA: { total: 2230, per_1000: 8.10, avg_salary: 35180 }, LPN: { total: 780, per_1000: 2.83, avg_salary: 50050 } },
  DC: { RN: { total: 13580, per_1000: 17.19, avg_salary: 102030 }, CNA: { total: 4990, per_1000: 6.31, avg_salary: 39620 }, LPN: { total: 1730, per_1000: 2.19, avg_salary: 56120 } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state")?.toUpperCase();
  const roleType = searchParams.get("role_type");

  if (!state) {
    return NextResponse.json({ error: "State is required" }, { status: 400 });
  }

  const stateData = BLS_REAL_DATA[state];
  const oesInfo = roleType ? OES_CODES[roleType] : null;

  if (!stateData) {
    return NextResponse.json({
      state,
      available: false,
      message: `No OES data available for ${state}.`,
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
      interpretation: data.per_1000 > 20
        ? "Very high density — large talent pool but competitive market"
        : data.per_1000 > 15
        ? "Above average density — healthy supply of candidates"
        : data.per_1000 > 10
        ? "Moderate density — balanced supply and demand"
        : data.per_1000 > 5
        ? "Below average — may need relocation incentives"
        : "Low density — scarce workforce, strong incentives required",
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
    source: "BLS Occupational Employment and Wage Statistics, May 2023",
    bls_link: `https://www.bls.gov/oes/current/oes_${state.toLowerCase()}.htm`,
  });
}
