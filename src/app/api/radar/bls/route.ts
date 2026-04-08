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

// BLS OEWS May 2024 — real published data, all 50 states + DC
// Source: state_M2024_dl.xlsx from https://www.bls.gov/oes/tables.htm
const BLS_DATA: Record<string, Record<string, { total: number; per_1000: number; avg_salary: number }>> = {
  AK: { RN: { total: 7040, per_1000: 21.92, avg_salary: 112040 }, CNA: { total: 1660, per_1000: 5.159, avg_salary: 48550 }, LPN: { total: 300, per_1000: 0.935, avg_salary: 77850 } },
  AL: { RN: { total: 53340, per_1000: 25.503, avg_salary: 74970 }, CNA: { total: 24560, per_1000: 11.741, avg_salary: 32670 }, LPN: { total: 10840, per_1000: 5.182, avg_salary: 50760 } },
  AR: { RN: { total: 28320, per_1000: 21.97, avg_salary: 77720 }, CNA: { total: 17620, per_1000: 13.67, avg_salary: 33350 }, LPN: { total: 10110, per_1000: 7.847, avg_salary: 52540 } },
  AZ: { RN: { total: 64430, per_1000: 20.155, avg_salary: 95230 }, CNA: { total: 17350, per_1000: 5.428, avg_salary: 43060 }, LPN: { total: 5200, per_1000: 1.628, avg_salary: 72840 } },
  CA: { RN: { total: 326720, per_1000: 18.093, avg_salary: 148330 }, CNA: { total: 102380, per_1000: 5.67, avg_salary: 48790 }, LPN: { total: 79610, per_1000: 4.409, avg_salary: 79090 } },
  CO: { RN: { total: 54510, per_1000: 18.853, avg_salary: 95470 }, CNA: { total: 20880, per_1000: 7.222, avg_salary: 45480 }, LPN: { total: 5030, per_1000: 1.74, avg_salary: 68570 } },
  CT: { RN: { total: 39020, per_1000: 23.198, avg_salary: 103670 }, CNA: { total: 21390, per_1000: 12.717, avg_salary: 44860 }, LPN: { total: 8890, per_1000: 5.283, avg_salary: 70240 } },
  DC: { RN: { total: 9790, per_1000: 13.81, avg_salary: 109240 }, CNA: { total: 2550, per_1000: 3.601, avg_salary: 47480 }, LPN: { total: 1170, per_1000: 1.648, avg_salary: 70530 } },
  DE: { RN: { total: 13260, per_1000: 27.822, avg_salary: 95450 }, CNA: { total: 5660, per_1000: 11.885, avg_salary: 40120 }, LPN: { total: 1600, per_1000: 3.351, avg_salary: 66510 } },
  FL: { RN: { total: 218100, per_1000: 22.21, avg_salary: 88200 }, CNA: { total: 91280, per_1000: 9.296, avg_salary: 38320 }, LPN: { total: 36470, per_1000: 3.714, avg_salary: 60320 } },
  GA: { RN: { total: 97410, per_1000: 20.059, avg_salary: 91960 }, CNA: { total: 42460, per_1000: 8.744, avg_salary: 37090 }, LPN: { total: 20800, per_1000: 4.283, avg_salary: 58090 } },
  HI: { RN: { total: 13100, per_1000: 21.099, avg_salary: 123720 }, CNA: { total: 4620, per_1000: 7.439, avg_salary: 45480 }, LPN: { total: 710, per_1000: 1.137, avg_salary: 67540 } },
  IA: { RN: { total: 33480, per_1000: 21.438, avg_salary: 77780 }, CNA: { total: 22970, per_1000: 14.709, avg_salary: 40590 }, LPN: { total: 5520, per_1000: 3.535, avg_salary: 59640 } },
  ID: { RN: { total: 14540, per_1000: 17.214, avg_salary: 89770 }, CNA: { total: 7340, per_1000: 8.684, avg_salary: 37740 }, LPN: { total: 2380, per_1000: 2.82, avg_salary: 59340 } },
  IL: { RN: { total: 139900, per_1000: 23.066, avg_salary: 91130 }, CNA: { total: 64660, per_1000: 10.66, avg_salary: 43950 }, LPN: { total: 18230, per_1000: 3.006, avg_salary: 68450 } },
  IN: { RN: { total: 68950, per_1000: 21.638, avg_salary: 85850 }, CNA: { total: 31240, per_1000: 9.804, avg_salary: 38610 }, LPN: { total: 14680, per_1000: 4.607, avg_salary: 62990 } },
  KS: { RN: { total: 32640, per_1000: 22.805, avg_salary: 79430 }, CNA: { total: 23950, per_1000: 16.737, avg_salary: 38600 }, LPN: { total: 6940, per_1000: 4.85, avg_salary: 59930 } },
  KY: { RN: { total: 48170, per_1000: 24.163, avg_salary: 83900 }, CNA: { total: 22910, per_1000: 11.491, avg_salary: 37960 }, LPN: { total: 9190, per_1000: 4.612, avg_salary: 57410 } },
  LA: { RN: { total: 46790, per_1000: 24.479, avg_salary: 84110 }, CNA: { total: 20550, per_1000: 10.751, avg_salary: 31700 }, LPN: { total: 18630, per_1000: 9.746, avg_salary: 54610 } },
  MA: { RN: { total: 90190, per_1000: 24.759, avg_salary: 112610 }, CNA: { total: 38280, per_1000: 10.508, avg_salary: 46130 }, LPN: { total: 15210, per_1000: 4.174, avg_salary: 76400 } },
  MD: { RN: { total: 48980, per_1000: 17.835, avg_salary: 96650 }, CNA: { total: 24230, per_1000: 8.824, avg_salary: 42070 }, LPN: { total: 9510, per_1000: 3.461, avg_salary: 70700 } },
  ME: { RN: { total: 16280, per_1000: 25.626, avg_salary: 87440 }, CNA: { total: 8590, per_1000: 13.518, avg_salary: 45500 }, LPN: { total: 850, per_1000: 1.337, avg_salary: 72600 } },
  MI: { RN: { total: 104210, per_1000: 23.735, avg_salary: 90580 }, CNA: { total: 40230, per_1000: 9.163, avg_salary: 40210 }, LPN: { total: 11060, per_1000: 2.519, avg_salary: 65430 } },
  MN: { RN: { total: 64740, per_1000: 22.167, avg_salary: 99460 }, CNA: { total: 26970, per_1000: 9.233, avg_salary: 45230 }, LPN: { total: 12740, per_1000: 4.363, avg_salary: 61270 } },
  MO: { RN: { total: 74270, per_1000: 25.452, avg_salary: 81950 }, CNA: { total: 32650, per_1000: 11.189, avg_salary: 37650 }, LPN: { total: 14320, per_1000: 4.907, avg_salary: 58900 } },
  MS: { RN: { total: 29400, per_1000: 25.351, avg_salary: 79470 }, CNA: { total: 13130, per_1000: 11.323, avg_salary: 31750 }, LPN: { total: 9880, per_1000: 8.519, avg_salary: 49960 } },
  MT: { RN: { total: 10540, per_1000: 20.666, avg_salary: 88480 }, CNA: { total: 4800, per_1000: 9.421, avg_salary: 42020 }, LPN: { total: 1630, per_1000: 3.201, avg_salary: 58710 } },
  NC: { RN: { total: 108510, per_1000: 22.153, avg_salary: 86270 }, CNA: { total: 61280, per_1000: 12.511, avg_salary: 37980 }, LPN: { total: 17430, per_1000: 3.558, avg_salary: 62040 } },
  ND: { RN: { total: 11000, per_1000: 25.953, avg_salary: 81900 }, CNA: { total: 6920, per_1000: 16.323, avg_salary: 42530 }, LPN: { total: 1930, per_1000: 4.554, avg_salary: 60110 } },
  NE: { RN: { total: 24180, per_1000: 23.801, avg_salary: 82890 }, CNA: { total: 16490, per_1000: 16.232, avg_salary: 40830 }, LPN: { total: 4820, per_1000: 4.747, avg_salary: 60240 } },
  NH: { RN: { total: 16580, per_1000: 24.266, avg_salary: 94620 }, CNA: { total: 7190, per_1000: 10.529, avg_salary: 47190 }, LPN: { total: 2130, per_1000: 3.116, avg_salary: 73850 } },
  NJ: { RN: { total: 95150, per_1000: 22.387, avg_salary: 106990 }, CNA: { total: 31310, per_1000: 7.365, avg_salary: 44480 }, LPN: { total: 15210, per_1000: 3.577, avg_salary: 71300 } },
  NM: { RN: { total: 17510, per_1000: 20.343, avg_salary: 94360 }, CNA: { total: 4600, per_1000: 5.349, avg_salary: 38320 }, LPN: { total: 1850, per_1000: 2.155, avg_salary: 56690 } },
  NV: { RN: { total: 27570, per_1000: 18.024, avg_salary: 102280 }, CNA: { total: 8670, per_1000: 5.666, avg_salary: 44360 }, LPN: { total: 3210, per_1000: 2.098, avg_salary: 71460 } },
  NY: { RN: { total: 204120, per_1000: 21.392, avg_salary: 110490 }, CNA: { total: 85310, per_1000: 8.941, avg_salary: 47530 }, LPN: { total: 40720, per_1000: 4.267, avg_salary: 66380 } },
  OH: { RN: { total: 138360, per_1000: 25.037, avg_salary: 86110 }, CNA: { total: 62360, per_1000: 11.284, avg_salary: 39840 }, LPN: { total: 36440, per_1000: 6.595, avg_salary: 60600 } },
  OK: { RN: { total: 32870, per_1000: 19.426, avg_salary: 85800 }, CNA: { total: 19860, per_1000: 11.737, avg_salary: 34900 }, LPN: { total: 11820, per_1000: 6.986, avg_salary: 55270 } },
  OR: { RN: { total: 39900, per_1000: 20.3, avg_salary: 120470 }, CNA: { total: 12800, per_1000: 6.511, avg_salary: 49970 }, LPN: { total: 4340, per_1000: 2.208, avg_salary: 78160 } },
  PA: { RN: { total: 146840, per_1000: 24.415, avg_salary: 90830 }, CNA: { total: 65410, per_1000: 10.877, avg_salary: 41700 }, LPN: { total: 31140, per_1000: 5.177, avg_salary: 62550 } },
  RI: { RN: { total: 10760, per_1000: 21.796, avg_salary: 99770 }, CNA: { total: 8450, per_1000: 17.11, avg_salary: 43740 }, LPN: { total: 1080, per_1000: 2.191, avg_salary: 77240 } },
  SC: { RN: { total: 50300, per_1000: 22.143, avg_salary: 84930 }, CNA: { total: 21000, per_1000: 9.244, avg_salary: 35970 }, LPN: { total: 8740, per_1000: 3.846, avg_salary: 58430 } },
  SD: { RN: { total: 14500, per_1000: 32.017, avg_salary: 72210 }, CNA: { total: 6520, per_1000: 14.393, avg_salary: 38070 }, LPN: { total: 2100, per_1000: 4.641, avg_salary: 51230 } },
  TN: { RN: { total: 67990, per_1000: 20.765, avg_salary: 82010 }, CNA: { total: 23030, per_1000: 7.032, avg_salary: 37040 }, LPN: { total: 19140, per_1000: 5.846, avg_salary: 53490 } },
  TX: { RN: { total: 261050, per_1000: 18.853, avg_salary: 91690 }, CNA: { total: 87050, per_1000: 6.287, avg_salary: 37010 }, LPN: { total: 59060, per_1000: 4.266, avg_salary: 60020 } },
  UT: { RN: { total: 25780, per_1000: 15.078, avg_salary: 88240 }, CNA: { total: 12350, per_1000: 7.222, avg_salary: 39240 }, LPN: { total: 1690, per_1000: 0.986, avg_salary: 61390 } },
  VA: { RN: { total: 77420, per_1000: 19.048, avg_salary: 90930 }, CNA: { total: 42760, per_1000: 10.52, avg_salary: 40160 }, LPN: { total: 16710, per_1000: 4.111, avg_salary: 63380 } },
  VT: { RN: { total: 7240, per_1000: 23.793, avg_salary: 92710 }, CNA: { total: 3140, per_1000: 10.333, avg_salary: 43610 }, LPN: { total: 1260, per_1000: 4.132, avg_salary: 68580 } },
  WA: { RN: { total: 64690, per_1000: 18.275, avg_salary: 115740 }, CNA: { total: 28080, per_1000: 7.934, avg_salary: 49960 }, LPN: { total: 6450, per_1000: 1.823, avg_salary: 79970 } },
  WI: { RN: { total: 64960, per_1000: 22.219, avg_salary: 90450 }, CNA: { total: 27480, per_1000: 9.399, avg_salary: 43050 }, LPN: { total: 6830, per_1000: 2.336, avg_salary: 61680 } },
  WV: { RN: { total: 21740, per_1000: 30.996, avg_salary: 80650 }, CNA: { total: 8860, per_1000: 12.633, avg_salary: 36320 }, LPN: { total: 6330, per_1000: 9.026, avg_salary: 52540 } },
  WY: { RN: { total: 5180, per_1000: 18.6, avg_salary: 88020 }, CNA: { total: 2680, per_1000: 9.621, avg_salary: 41040 }, LPN: { total: 530, per_1000: 1.911, avg_salary: 61080 } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state")?.toUpperCase();
  const roleType = searchParams.get("role_type");

  if (!state) {
    return NextResponse.json({ error: "State is required" }, { status: 400 });
  }

  const stateData = BLS_DATA[state];
  const oesInfo = roleType ? OES_CODES[roleType] : null;

  if (!stateData) {
    return NextResponse.json({
      state,
      available: false,
      message: `No OES data for ${state}.`,
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
      source: "BLS Occupational Employment and Wage Statistics, May 2024",
      interpretation: data.per_1000 > 24
        ? "Very high density — large talent pool but competitive market"
        : data.per_1000 > 18
        ? "Above average density — healthy supply of candidates"
        : data.per_1000 > 10
        ? "Moderate density — balanced supply and demand"
        : data.per_1000 > 5
        ? "Below average — may need relocation incentives"
        : "Low density — scarce workforce, strong incentives required",
    });
  }

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
    source: "BLS Occupational Employment and Wage Statistics, May 2024",
    bls_link: `https://www.bls.gov/oes/current/oes_${state.toLowerCase()}.htm`,
  });
}
