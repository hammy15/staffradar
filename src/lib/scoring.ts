import type { Candidate, Building } from "./types";

// Nurse Licensure Compact states (as of 2024)
export const COMPACT_STATES = new Set([
  "AL", "AZ", "AR", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MS", "MO", "MT",
  "NE", "NH", "NJ", "NM", "NC", "ND", "OH", "OK", "PA", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WV", "WI", "WY",
]);

// Cost of living index by state (US avg = 100)
export const STATE_COL_INDEX: Record<string, number> = {
  AL: 89, AK: 125, AZ: 103, AR: 87, CA: 142, CO: 105, CT: 113, DE: 103,
  FL: 101, GA: 93, HI: 170, ID: 97, IL: 93, IN: 90, IA: 90, KS: 87,
  KY: 87, LA: 91, ME: 99, MD: 113, MA: 131, MI: 90, MN: 98, MS: 84,
  MO: 88, MT: 96, NE: 91, NV: 104, NH: 106, NJ: 120, NM: 93, NY: 139,
  NC: 96, ND: 92, OH: 90, OK: 86, OR: 113, PA: 97, RI: 108, SC: 95,
  SD: 92, TN: 90, TX: 92, UT: 101, VT: 107, VA: 103, WA: 115, WV: 84,
  WI: 93, WY: 92, DC: 148,
};

// Average RN salary by state
export const STATE_RN_SALARY: Record<string, number> = {
  AL: 62000, AK: 88000, AZ: 77000, AR: 61000, CA: 124000, CO: 79000, CT: 84000, DE: 74000,
  FL: 68000, GA: 70000, HI: 104000, ID: 68000, IL: 73000, IN: 65000, IA: 62000, KS: 62000,
  KY: 63000, LA: 64000, ME: 68000, MD: 80000, MA: 94000, MI: 72000, MN: 77000, MS: 60000,
  MO: 64000, MT: 68000, NE: 63000, NV: 82000, NH: 72000, NJ: 87000, NM: 71000, NY: 93000,
  NC: 68000, ND: 65000, OH: 68000, OK: 62000, OR: 92000, PA: 72000, RI: 78000, SC: 65000,
  SD: 60000, TN: 64000, TX: 74000, UT: 67000, VT: 68000, VA: 73000, WA: 95000, WV: 62000,
  WI: 69000, WY: 68000, DC: 93000,
};

export interface ScoreBreakdown {
  total: number;
  proximity: number;
  license_recency: number;
  compact_license: number;
  role_match: number;
  availability_signal: number;
  relocation_potential: number;
}

export function scoreCandidate(candidate: Candidate, building?: Building | null): ScoreBreakdown {
  let proximity = 0;
  let license_recency = 0;
  let compact_license = 0;
  let role_match = 0;
  let availability_signal = 0;
  let relocation_potential = 0;

  // Proximity: same state = 20, same city = 30
  if (building && candidate.state) {
    if (candidate.state === building.state) {
      proximity = 20;
      if (candidate.city?.toLowerCase() === building.city?.toLowerCase()) {
        proximity = 30;
      }
    } else if (candidate.willingness_to_relocate) {
      proximity = 15;
    }
  }

  // License recency (from NPI enumeration date, if available)
  // Newer license = more likely to be job seeking
  if (candidate.created_at) {
    const daysInPipeline = Math.floor(
      (Date.now() - new Date(candidate.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysInPipeline < 7) license_recency = 15;
    else if (daysInPipeline < 30) license_recency = 10;
    else license_recency = 5;
  }

  // Compact license: can work across state lines easily
  if (candidate.license_state && COMPACT_STATES.has(candidate.license_state)) {
    compact_license = 10;
  }

  // Role match: clinical roles weighted higher
  const highDemandRoles = ["RN", "CNA", "LPN"];
  if (highDemandRoles.includes(candidate.role_type)) {
    role_match = 20;
  } else if (["Med Tech", "Physical Therapist", "Occupational Therapist"].includes(candidate.role_type)) {
    role_match = 15;
  } else {
    role_match = 10;
  }

  // Availability signals
  if (candidate.is_traveler) availability_signal += 10;
  if (candidate.willingness_to_relocate) availability_signal += 5;
  if (candidate.status === "responded" || candidate.status === "interested") availability_signal += 5;

  // Relocation potential: high COL state → low COL state = incentive
  if (building && candidate.state && candidate.state !== building.state) {
    const candidateCOL = STATE_COL_INDEX[candidate.state] || 100;
    const buildingCOL = STATE_COL_INDEX[building.state] || 100;
    if (candidateCOL > buildingCOL + 10) {
      relocation_potential = 10; // They'd save money moving to your area
    }
  }

  const total = proximity + license_recency + compact_license + role_match + availability_signal + relocation_potential;

  return { total, proximity, license_recency, compact_license, role_match, availability_signal, relocation_potential };
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Hot Lead", color: "bg-red-100 text-red-700" };
  if (score >= 50) return { label: "Strong", color: "bg-orange-100 text-orange-700" };
  if (score >= 30) return { label: "Warm", color: "bg-amber-100 text-amber-700" };
  return { label: "Cool", color: "bg-blue-100 text-blue-700" };
}
