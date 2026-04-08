import { COMPACT_STATES, STATE_COL_INDEX, STATE_RN_SALARY } from "./scoring";

export interface RelocationAnalysis {
  from_state: string;
  to_state: string;
  col_from: number;
  col_to: number;
  col_savings_pct: number;
  salary_from: number;
  salary_to: number;
  salary_diff: number;
  purchasing_power_gain_pct: number;
  compact_from: boolean;
  compact_to: boolean;
  license_transfer_easy: boolean;
  housing_cost_index_from: number;
  housing_cost_index_to: number;
  relocation_score: number;
  incentives: string[];
  challenges: string[];
}

// Housing cost multipliers (relative to national avg)
const STATE_HOUSING_INDEX: Record<string, number> = {
  AL: 72, AK: 115, AZ: 108, AR: 68, CA: 192, CO: 128, CT: 126, DE: 105,
  FL: 115, GA: 87, HI: 252, ID: 108, IL: 85, IN: 78, IA: 72, KS: 72,
  KY: 75, LA: 82, ME: 105, MD: 132, MA: 165, MI: 78, MN: 95, MS: 65,
  MO: 78, MT: 105, NE: 82, NV: 118, NH: 118, NJ: 142, NM: 88, NY: 175,
  NC: 92, ND: 78, OH: 78, OK: 68, OR: 142, PA: 92, RI: 118, SC: 88,
  SD: 78, TN: 85, TX: 88, UT: 112, VT: 112, VA: 108, WA: 142, WV: 65,
  WI: 82, WY: 82, DC: 205,
};

export function analyzeRelocation(fromState: string, toState: string): RelocationAnalysis {
  const colFrom = STATE_COL_INDEX[fromState] || 100;
  const colTo = STATE_COL_INDEX[toState] || 100;
  const colSavings = ((colFrom - colTo) / colFrom) * 100;

  const salaryFrom = STATE_RN_SALARY[fromState] || 70000;
  const salaryTo = STATE_RN_SALARY[toState] || 70000;

  // Purchasing power = salary adjusted for COL
  const ppFrom = salaryFrom / (colFrom / 100);
  const ppTo = salaryTo / (colTo / 100);
  const ppGain = ((ppTo - ppFrom) / ppFrom) * 100;

  const compactFrom = COMPACT_STATES.has(fromState);
  const compactTo = COMPACT_STATES.has(toState);

  const housingFrom = STATE_HOUSING_INDEX[fromState] || 100;
  const housingTo = STATE_HOUSING_INDEX[toState] || 100;

  const incentives: string[] = [];
  const challenges: string[] = [];

  if (colSavings > 10) incentives.push(`${Math.round(colSavings)}% lower cost of living`);
  if (housingTo < housingFrom - 20) incentives.push(`Significantly cheaper housing`);
  if (ppGain > 5) incentives.push(`${Math.round(ppGain)}% gain in purchasing power`);
  if (compactFrom && compactTo) incentives.push("Compact license — can start working immediately");
  if (salaryTo > salaryFrom) incentives.push(`Higher average salary ($${((salaryTo - salaryFrom) / 1000).toFixed(0)}k more)`);

  if (colSavings < -10) challenges.push(`${Math.round(Math.abs(colSavings))}% higher cost of living`);
  if (housingTo > housingFrom + 20) challenges.push("More expensive housing market");
  if (!compactTo && compactFrom) challenges.push("Destination state is NOT in Nurse Compact — needs new license");
  if (salaryTo < salaryFrom - 5000) challenges.push(`Lower average salary ($${((salaryFrom - salaryTo) / 1000).toFixed(0)}k less)`);

  // Relocation score (0-100)
  let score = 50;
  if (colSavings > 0) score += Math.min(colSavings, 20);
  if (ppGain > 0) score += Math.min(ppGain, 15);
  if (compactFrom && compactTo) score += 10;
  if (housingTo < housingFrom) score += 10;
  if (colSavings < 0) score -= Math.min(Math.abs(colSavings), 20);
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    from_state: fromState,
    to_state: toState,
    col_from: colFrom,
    col_to: colTo,
    col_savings_pct: Math.round(colSavings * 10) / 10,
    salary_from: salaryFrom,
    salary_to: salaryTo,
    salary_diff: salaryTo - salaryFrom,
    purchasing_power_gain_pct: Math.round(ppGain * 10) / 10,
    compact_from: compactFrom,
    compact_to: compactTo,
    license_transfer_easy: compactFrom && compactTo,
    housing_cost_index_from: housingFrom,
    housing_cost_index_to: housingTo,
    relocation_score: score,
    incentives,
    challenges,
  };
}

// Military base locations with medical specialties
export const MILITARY_BASES_WITH_MEDICAL = [
  { name: "Fort Liberty (Bragg)", state: "NC", city: "Fayetteville", specialties: ["68W Combat Medic", "68C Practical Nurse", "66H Medical-Surgical Nurse"] },
  { name: "Fort Sam Houston", state: "TX", city: "San Antonio", specialties: ["68W Combat Medic", "68C Practical Nurse", "All Medical MOS"] },
  { name: "Fort Campbell", state: "KY", city: "Clarksville", specialties: ["68W Combat Medic", "68C Practical Nurse"] },
  { name: "Fort Hood (Cavazos)", state: "TX", city: "Killeen", specialties: ["68W Combat Medic", "68C Practical Nurse"] },
  { name: "Fort Stewart", state: "GA", city: "Hinesville", specialties: ["68W Combat Medic"] },
  { name: "JBSA Lackland", state: "TX", city: "San Antonio", specialties: ["4N0X1 Aerospace Medical Tech", "4N1X1 Surgical Service"] },
  { name: "Camp Pendleton", state: "CA", city: "Oceanside", specialties: ["HM Hospital Corpsman", "8404 Field Medical Tech"] },
  { name: "Camp Lejeune", state: "NC", city: "Jacksonville", specialties: ["HM Hospital Corpsman"] },
  { name: "Naval Medical Center San Diego", state: "CA", city: "San Diego", specialties: ["HM Hospital Corpsman", "Nurse Corps"] },
  { name: "Walter Reed NMMC", state: "MD", city: "Bethesda", specialties: ["All Medical MOS"] },
  { name: "Madigan Army Medical Center", state: "WA", city: "Tacoma", specialties: ["All Medical MOS"] },
  { name: "Fort Eisenhower (Gordon)", state: "GA", city: "Augusta", specialties: ["68W Combat Medic"] },
  { name: "Fort Drum", state: "NY", city: "Watertown", specialties: ["68W Combat Medic", "68C Practical Nurse"] },
  { name: "Fort Carson", state: "CO", city: "Colorado Springs", specialties: ["68W Combat Medic"] },
  { name: "Fort Bliss", state: "TX", city: "El Paso", specialties: ["68W Combat Medic", "68C Practical Nurse"] },
  { name: "Joint Base Lewis-McChord", state: "WA", city: "Tacoma", specialties: ["68W Combat Medic", "68C Practical Nurse"] },
  { name: "Naval Station Norfolk", state: "VA", city: "Norfolk", specialties: ["HM Hospital Corpsman"] },
  { name: "Naval Station Jacksonville", state: "FL", city: "Jacksonville", specialties: ["HM Hospital Corpsman"] },
];

// Military-to-civilian role mapping
export const MILITARY_ROLE_CROSSWALK: Record<string, string[]> = {
  "68W Combat Medic": ["CNA", "Med Tech", "EMT"],
  "68C Practical Nurse": ["LPN", "CNA"],
  "66H Medical-Surgical Nurse": ["RN"],
  "66P Psychiatric Nurse": ["RN"],
  "HM Hospital Corpsman": ["CNA", "Med Tech", "LPN"],
  "8404 Field Medical Tech": ["CNA", "Med Tech"],
  "4N0X1 Aerospace Medical Tech": ["CNA", "Med Tech"],
  "4N1X1 Surgical Service": ["Med Tech", "CNA"],
  "Nurse Corps": ["RN"],
};
