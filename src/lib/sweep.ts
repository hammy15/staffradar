// Full Radar Sweep Engine
// Career-Ops inspired: one-click scans NPI + CMS + scores + recommends outreach
import { scoreCandidate, COMPACT_STATES, STATE_COL_INDEX, STATE_RN_SALARY } from "./scoring";
import type { Building, Candidate } from "./types";

export interface SweepConfig {
  building: Building;
  roles: string[];
  radius_miles?: number;
  max_per_role?: number;
}

export interface DimensionScore {
  dimension: string;
  score: number; // 0-10
  weight: number; // multiplier
  reason: string;
  grade: string; // A-F
}

export interface AdvancedScore {
  total: number; // 0-100
  grade: string; // A-F
  dimensions: DimensionScore[];
  recommendation: "immediate_contact" | "strong_prospect" | "worth_pursuing" | "low_priority" | "skip";
  outreach_strategy: string;
}

function gradeFromScore(score: number): string {
  if (score >= 9) return "A+";
  if (score >= 8) return "A";
  if (score >= 7) return "B+";
  if (score >= 6) return "B";
  if (score >= 5) return "C+";
  if (score >= 4) return "C";
  if (score >= 3) return "D";
  return "F";
}

export function advancedScoreCandidate(candidate: Partial<Candidate>, building: Building): AdvancedScore {
  const dimensions: DimensionScore[] = [];

  // 1. Proximity (weight: 1.5)
  let proxScore = 2;
  let proxReason = "Unknown location";
  if (candidate.state === building.state) {
    if (candidate.city?.toLowerCase() === building.city.toLowerCase()) {
      proxScore = 10; proxReason = "Same city — no relocation needed";
    } else {
      proxScore = 7; proxReason = "Same state — short commute or minor move";
    }
  } else if (candidate.state) {
    const colDiff = (STATE_COL_INDEX[candidate.state] || 100) - (STATE_COL_INDEX[building.state] || 100);
    if (colDiff > 15) { proxScore = 6; proxReason = `Higher COL state (${candidate.state}) — financial incentive to relocate`; }
    else if (colDiff > 0) { proxScore = 4; proxReason = "Different state, slight COL advantage"; }
    else { proxScore = 3; proxReason = "Different state, no COL incentive"; }
  }
  dimensions.push({ dimension: "Proximity", score: proxScore, weight: 1.5, reason: proxReason, grade: gradeFromScore(proxScore) });

  // 2. License & Compact (weight: 1.3)
  let licScore = 3;
  let licReason = "No license info";
  if (candidate.license_state) {
    const candidateCompact = COMPACT_STATES.has(candidate.license_state);
    const buildingCompact = COMPACT_STATES.has(building.state);
    if (candidate.license_state === building.state) {
      licScore = 10; licReason = "Licensed in building's state — can start immediately";
    } else if (candidateCompact && buildingCompact) {
      licScore = 9; licReason = "Both states in Nurse Compact — immediate practice rights";
    } else if (candidateCompact || buildingCompact) {
      licScore = 6; licReason = "One state in compact — endorsement needed but faster";
    } else {
      licScore = 4; licReason = "Neither state in compact — full endorsement process needed";
    }
  }
  dimensions.push({ dimension: "License Portability", score: licScore, weight: 1.3, reason: licReason, grade: gradeFromScore(licScore) });

  // 3. Role Demand (weight: 1.5)
  const highDemand = ["RN", "CNA", "LPN"];
  const medDemand = ["Med Tech", "Physical Therapist", "Occupational Therapist"];
  let roleScore = 5;
  let roleReason = "Standard demand role";
  if (highDemand.includes(candidate.role_type || "")) {
    roleScore = 10; roleReason = `${candidate.role_type} — critical shortage role, highest demand`;
  } else if (medDemand.includes(candidate.role_type || "")) {
    roleScore = 7; roleReason = `${candidate.role_type} — moderate demand, specialized`;
  }
  dimensions.push({ dimension: "Role Demand", score: roleScore, weight: 1.5, reason: roleReason, grade: gradeFromScore(roleScore) });

  // 4. Salary Arbitrage (weight: 1.0)
  let salaryScore = 5;
  let salaryReason = "No salary comparison available";
  if (candidate.state && candidate.state !== building.state) {
    const fromSalary = STATE_RN_SALARY[candidate.state] || 70000;
    const toSalary = STATE_RN_SALARY[building.state] || 70000;
    const fromCOL = STATE_COL_INDEX[candidate.state] || 100;
    const toCOL = STATE_COL_INDEX[building.state] || 100;
    const ppFrom = fromSalary / (fromCOL / 100);
    const ppTo = toSalary / (toCOL / 100);
    const ppGain = ((ppTo - ppFrom) / ppFrom) * 100;
    if (ppGain > 15) { salaryScore = 10; salaryReason = `${Math.round(ppGain)}% purchasing power gain — very compelling pitch`; }
    else if (ppGain > 5) { salaryScore = 7; salaryReason = `${Math.round(ppGain)}% purchasing power gain — good incentive`; }
    else if (ppGain > -5) { salaryScore = 5; salaryReason = "Neutral purchasing power — salary parity"; }
    else { salaryScore = 3; salaryReason = `${Math.round(Math.abs(ppGain))}% purchasing power loss — needs signing bonus`; }
  } else if (candidate.state === building.state) {
    salaryScore = 7; salaryReason = "Same state — competitive local salary";
  }
  dimensions.push({ dimension: "Salary Arbitrage", score: salaryScore, weight: 1.0, reason: salaryReason, grade: gradeFromScore(salaryScore) });

  // 5. Availability Signals (weight: 1.2)
  let availScore = 4;
  let availReason = "No availability signals detected";
  if (candidate.is_traveler) { availScore = 9; availReason = "Travel nurse — actively seeks placements"; }
  else if (candidate.willingness_to_relocate) { availScore = 8; availReason = "Willing to relocate — open to opportunities"; }
  else if (candidate.status === "responded" || candidate.status === "interested") { availScore = 9; availReason = "Already engaged — high availability"; }
  dimensions.push({ dimension: "Availability Signals", score: availScore, weight: 1.2, reason: availReason, grade: gradeFromScore(availScore) });

  // 6. Recency (weight: 0.8) — how recently discovered
  let recencyScore = 5;
  let recencyReason = "Standard pipeline timing";
  if (candidate.created_at) {
    const daysOld = Math.floor((Date.now() - new Date(candidate.created_at).getTime()) / 86400000);
    if (daysOld < 3) { recencyScore = 10; recencyReason = "Just discovered — fresh lead, act fast"; }
    else if (daysOld < 7) { recencyScore = 8; recencyReason = "Discovered this week — still hot"; }
    else if (daysOld < 30) { recencyScore = 6; recencyReason = "Discovered this month"; }
    else { recencyScore = 3; recencyReason = "In pipeline 30+ days — may have moved on"; }
  }
  dimensions.push({ dimension: "Recency", score: recencyScore, weight: 0.8, reason: recencyReason, grade: gradeFromScore(recencyScore) });

  // 7. Contact Info Quality (weight: 1.0)
  let contactScore = 2;
  let contactReason = "No contact info — hard to reach";
  if (candidate.phone && candidate.email) { contactScore = 10; contactReason = "Phone + email — full contact capability"; }
  else if (candidate.phone) { contactScore = 8; contactReason = "Phone available — can call/text directly"; }
  else if (candidate.email) { contactScore = 7; contactReason = "Email available"; }
  dimensions.push({ dimension: "Contact Quality", score: contactScore, weight: 1.0, reason: contactReason, grade: gradeFromScore(contactScore) });

  // 8. Credentials (weight: 0.7)
  let credScore = 5;
  let credReason = "Standard credentials";
  if (candidate.credentials) {
    const creds = candidate.credentials.toUpperCase();
    if (creds.includes("BSN") || creds.includes("MSN") || creds.includes("DNP")) {
      credScore = 9; credReason = `Advanced degree (${candidate.credentials}) — premium candidate`;
    } else if (creds.includes("RN") || creds.includes("LPN")) {
      credScore = 7; credReason = `Licensed (${candidate.credentials})`;
    }
  }
  dimensions.push({ dimension: "Credentials", score: credScore, weight: 0.7, reason: credReason, grade: gradeFromScore(credScore) });

  // 9. Competitor Vulnerability (weight: 1.0) — based on current employer
  let compScore = 5;
  let compReason = "Unknown employer situation";
  if (candidate.current_employer) {
    compScore = 6; compReason = `Currently at ${candidate.current_employer} — can research their staffing rating`;
  }
  dimensions.push({ dimension: "Competitor Intel", score: compScore, weight: 1.0, reason: compReason, grade: gradeFromScore(compScore) });

  // 10. Building Fit (weight: 0.8) — SNF vs ALF vs HH role alignment
  let fitScore = 6;
  let fitReason = "General fit";
  const role = candidate.role_type || "";
  if (building.type === "SNF" && ["RN", "CNA", "LPN"].includes(role)) {
    fitScore = 9; fitReason = `${role} is core to SNF operations — ideal fit`;
  } else if (building.type === "ALF" && ["CNA", "Med Tech", "LPN"].includes(role)) {
    fitScore = 9; fitReason = `${role} is essential for ALF — great match`;
  } else if (building.type === "HH" && ["RN", "LPN", "Physical Therapist"].includes(role)) {
    fitScore = 9; fitReason = `${role} is perfect for Home Health`;
  } else if (building.type === "Hospice" && ["RN", "CNA", "Social Worker"].includes(role)) {
    fitScore = 9; fitReason = `${role} is critical for Hospice care`;
  }
  dimensions.push({ dimension: "Building Fit", score: fitScore, weight: 0.8, reason: fitReason, grade: gradeFromScore(fitScore) });

  // Calculate weighted total
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const weightedSum = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
  const total = Math.round((weightedSum / totalWeight) * 10); // 0-100

  const grade = total >= 85 ? "A" : total >= 75 ? "B+" : total >= 65 ? "B" : total >= 55 ? "C+" : total >= 45 ? "C" : total >= 35 ? "D" : "F";

  // Recommendation
  let recommendation: AdvancedScore["recommendation"];
  let outreach_strategy: string;

  if (total >= 80) {
    recommendation = "immediate_contact";
    outreach_strategy = "Call or text TODAY. This is a hot lead — don't wait. Use personalized pitch.";
  } else if (total >= 65) {
    recommendation = "strong_prospect";
    outreach_strategy = "Send personalized email within 48 hours. Follow up with call in 3 days.";
  } else if (total >= 50) {
    recommendation = "worth_pursuing";
    outreach_strategy = "Add to email campaign. Send template outreach, follow up in 1 week.";
  } else if (total >= 35) {
    recommendation = "low_priority";
    outreach_strategy = "Keep in pipeline but don't prioritize. Check back if their situation changes.";
  } else {
    recommendation = "skip";
    outreach_strategy = "Low probability of conversion. Focus resources on higher-scored candidates.";
  }

  return { total, grade, dimensions, recommendation, outreach_strategy };
}

// Generate outreach packet content for a candidate
export function generateOutreachPacket(candidate: Partial<Candidate>, building: Building, score: AdvancedScore): string {
  const fromState = candidate.state || "??";
  const toState = building.state;
  const fromCOL = STATE_COL_INDEX[fromState] || 100;
  const toCOL = STATE_COL_INDEX[toState] || 100;
  const fromSalary = STATE_RN_SALARY[fromState] || 70000;
  const toSalary = STATE_RN_SALARY[toState] || 70000;
  const compactFrom = COMPACT_STATES.has(fromState);
  const compactTo = COMPACT_STATES.has(toState);

  let packet = `
═══════════════════════════════════════════
  STAFFRADAR RECRUITING PACKET
  ${candidate.first_name} ${candidate.last_name} ${candidate.credentials || ""}
═══════════════════════════════════════════

CANDIDATE PROFILE
─────────────────
Name:        ${candidate.first_name} ${candidate.last_name}
Role:        ${candidate.role_type}
NPI:         ${candidate.npi || "N/A"}
Location:    ${candidate.city || "?"}, ${fromState}
Phone:       ${candidate.phone || "N/A"}
Email:       ${candidate.email || "N/A"}
License:     ${candidate.license_state || "?"} ${candidate.license_number || ""}

TARGET FACILITY
───────────────
Building:    ${building.name}
Type:        ${building.type}
Location:    ${building.city}, ${building.state} ${building.zip}
Phone:       ${building.phone || "N/A"}

MATCH SCORE: ${score.total}/100 (Grade: ${score.grade})
RECOMMENDATION: ${score.recommendation.replace(/_/g, " ").toUpperCase()}
STRATEGY: ${score.outreach_strategy}

SCORING BREAKDOWN
─────────────────`;

  for (const dim of score.dimensions) {
    const bar = "█".repeat(dim.score) + "░".repeat(10 - dim.score);
    packet += `\n${dim.dimension.padEnd(20)} ${bar} ${dim.score}/10 (${dim.grade})`;
    packet += `\n${"".padEnd(20)} ${dim.reason}`;
  }

  if (fromState !== toState) {
    const colSavings = ((fromCOL - toCOL) / fromCOL * 100);
    packet += `

RELOCATION ANALYSIS (${fromState} → ${toState})
─────────────────────────────────
Cost of Living:      ${fromCOL} → ${toCOL} (${colSavings > 0 ? colSavings.toFixed(0) + "% cheaper" : Math.abs(colSavings).toFixed(0) + "% more expensive"})
Avg RN Salary:       $${(fromSalary/1000).toFixed(0)}k → $${(toSalary/1000).toFixed(0)}k
Nurse Compact:       ${compactFrom ? "✓" : "✗"} ${fromState} → ${compactTo ? "✓" : "✗"} ${toState}
License Transfer:    ${compactFrom && compactTo ? "IMMEDIATE — both Compact states" : "Endorsement required (2-8 weeks)"}`;

    if (colSavings > 5) {
      packet += `
KEY SELLING POINT:   "${candidate.first_name}, your dollar goes ${colSavings.toFixed(0)}% further in ${toState}. Same quality of life, more money in your pocket."`;
    }
  }

  packet += `

SUGGESTED OUTREACH SCRIPT
─────────────────────────
"Hi ${candidate.first_name}, this is [YOUR NAME] from ${building.name} in ${building.city}, ${building.state}. `;

  if (score.total >= 80) {
    packet += `I came across your profile and I have to say, you're exactly who we're looking for. We have a ${candidate.role_type} position that I think you'll be excited about. Can I tell you about it?"`;
  } else if (score.total >= 65) {
    packet += `We're hiring ${candidate.role_type}s and I think your background would be a great fit. Do you have a few minutes to chat about what we offer?"`;
  } else {
    packet += `We have some exciting opportunities for ${candidate.role_type}s and I wanted to see if you might be interested. When would be a good time to talk?"`;
  }

  packet += `

═══════════════════════════════════════════
Generated by StaffRadar | ${new Date().toLocaleDateString()}
═══════════════════════════════════════════`;

  return packet;
}
