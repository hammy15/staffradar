import { NextRequest, NextResponse } from "next/server";
import { MILITARY_BASES_WITH_MEDICAL, MILITARY_ROLE_CROSSWALK } from "@/lib/relocation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state");
  const roleType = searchParams.get("role_type");

  let bases = MILITARY_BASES_WITH_MEDICAL;

  if (state) {
    bases = bases.filter((b) => b.state === state.toUpperCase());
  }

  // Map civilian role to military specialties
  let relevantMOS: string[] = [];
  if (roleType) {
    for (const [mos, civilianRoles] of Object.entries(MILITARY_ROLE_CROSSWALK)) {
      if (civilianRoles.includes(roleType)) {
        relevantMOS.push(mos);
      }
    }
  }

  // Enrich with crosswalk data
  const results = bases.map((base) => {
    const matchingSpecialties = relevantMOS.length > 0
      ? base.specialties.filter((s) => relevantMOS.includes(s))
      : base.specialties;

    return {
      ...base,
      matching_specialties: matchingSpecialties,
      relevance: matchingSpecialties.length > 0 ? "high" : "low",
      crosswalk: base.specialties.map((s) => ({
        military: s,
        civilian_roles: MILITARY_ROLE_CROSSWALK[s] || [],
      })),
      tip: `Contact the Soldier for Life / Transition Assistance Program (SFL-TAP) at ${base.name}. They connect transitioning service members with employers.`,
    };
  });

  // Sort: high relevance first
  results.sort((a, b) => (b.relevance === "high" ? 1 : 0) - (a.relevance === "high" ? 1 : 0));

  return NextResponse.json({
    bases: results,
    total: results.length,
    role_crosswalk: roleType ? MILITARY_ROLE_CROSSWALK : undefined,
    tip: "The DOD SkillBridge program allows service members to work with civilian employers during their last 180 days of service. Many military medics are seeking healthcare careers.",
  });
}
