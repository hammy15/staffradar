import { NextRequest, NextResponse } from "next/server";

// State Board of Nursing directory — public lookup URLs
// These can be used for manual verification or future automated scraping
const STATE_NURSING_BOARDS: Record<string, { name: string; url: string; verification_url: string; notes: string }> = {
  AL: { name: "Alabama Board of Nursing", url: "https://www.abn.alabama.gov", verification_url: "https://www.abn.alabama.gov/verify-a-license/", notes: "Free online verification" },
  AK: { name: "Alaska Board of Nursing", url: "https://www.commerce.alaska.gov/web/cbpl/professionallicensing/boardofnursing", verification_url: "https://www.commerce.alaska.gov/cbp/main/Search/Professional", notes: "Searchable by name" },
  AZ: { name: "Arizona Board of Nursing", url: "https://www.azbn.gov", verification_url: "https://www.azbn.gov/licenses-and-certifications/verify-a-license", notes: "Free verification portal" },
  AR: { name: "Arkansas State Board of Nursing", url: "https://www.arsbn.org", verification_url: "https://www.arsbn.org/verify-a-license", notes: "Online lookup available" },
  CA: { name: "California Board of Registered Nursing", url: "https://www.rn.ca.gov", verification_url: "https://www.rn.ca.gov/verification.shtml", notes: "Separate board for LVNs" },
  CO: { name: "Colorado Board of Nursing", url: "https://dpo.colorado.gov/Nursing", verification_url: "https://apps.colorado.gov/dora/licensing/Lookup/LicenseLookup.aspx", notes: "DORA lookup system" },
  CT: { name: "Connecticut Board of Nursing", url: "https://portal.ct.gov/DPH/Practitioner-Licensing--Investigations/Registered-Nurse/Registered-Nurse", verification_url: "https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx", notes: "eLicense portal" },
  FL: { name: "Florida Board of Nursing", url: "https://floridasnursing.gov", verification_url: "https://mqa-internet.doh.state.fl.us/MQASearchServices/HealthCareProviders", notes: "MQA search" },
  GA: { name: "Georgia Board of Nursing", url: "https://sos.ga.gov/PLB/acrobat/Forms/38_Application_RN_Endorsement.pdf", verification_url: "https://sos.ga.gov/cgi-bin/plbgate.exe", notes: "Secretary of State lookup" },
  IL: { name: "Illinois Board of Nursing", url: "https://nursing.illinois.gov", verification_url: "https://ilesonline.idfpr.illinois.gov/DPR/Lookup/LicenseLookup.aspx", notes: "IDFPR lookup" },
  IN: { name: "Indiana State Board of Nursing", url: "https://www.in.gov/pla/professions/nursing-board/", verification_url: "https://mylicense.in.gov/EVerification/Search.aspx", notes: "eVerification system" },
  KY: { name: "Kentucky Board of Nursing", url: "https://kbn.ky.gov", verification_url: "https://kbn.ky.gov/Pages/NurseValidate.aspx", notes: "NurseValidate portal" },
  LA: { name: "Louisiana State Board of Nursing", url: "https://www.lsbn.state.la.us", verification_url: "https://www.lsbn.state.la.us/verification/", notes: "Online verification" },
  MA: { name: "Massachusetts Board of Registration in Nursing", url: "https://www.mass.gov/orgs/board-of-registration-in-nursing", verification_url: "https://checkalicense.mass.gov/", notes: "Check a License tool" },
  MI: { name: "Michigan Board of Nursing", url: "https://www.michigan.gov/lara/bureau-list/bpl/health/hp-lic-health-prof/nursing", verification_url: "https://aca-prod.accela.com/MILARA/GeneralProperty/PropertyLookUp.aspx", notes: "LARA lookup" },
  MN: { name: "Minnesota Board of Nursing", url: "https://mn.gov/boards/nursing/", verification_url: "https://mbn.hlb.state.mn.us/NursingLookup", notes: "Nursing lookup tool" },
  MO: { name: "Missouri State Board of Nursing", url: "https://pr.mo.gov/nursing.asp", verification_url: "https://pr.mo.gov/licensee-search.asp", notes: "Licensee search" },
  NJ: { name: "New Jersey Board of Nursing", url: "https://www.njconsumeraffairs.gov/nur/", verification_url: "https://newjersey.mylicense.com/verification/", notes: "MyLicense verification" },
  NY: { name: "New York Board of Nursing", url: "http://www.op.nysed.gov/professions/nurse/", verification_url: "http://www.op.nysed.gov/opsearches.htm", notes: "Office of Professions search" },
  NC: { name: "North Carolina Board of Nursing", url: "https://www.ncbon.com", verification_url: "https://www.ncbon.com/license-verification", notes: "License verification portal" },
  OH: { name: "Ohio Board of Nursing", url: "https://nursing.ohio.gov", verification_url: "https://elicense.ohio.gov/oh_verifylicense", notes: "eLicense Ohio" },
  PA: { name: "Pennsylvania Board of Nursing", url: "https://www.dos.pa.gov/ProfessionalLicensing/BoardsCommissions/Nursing/", verification_url: "https://www.pals.pa.gov/#/page/search", notes: "PALS search" },
  SC: { name: "South Carolina Board of Nursing", url: "https://llr.sc.gov/nurse/", verification_url: "https://verify.llronline.com/LicLookup/Nurse/Nurse.aspx", notes: "LLR verification" },
  TN: { name: "Tennessee Board of Nursing", url: "https://www.tn.gov/health/health-program-areas/health-professional-boards/nursing-board/", verification_url: "https://apps.health.tn.gov/Licensure/default.aspx", notes: "Health licensure search" },
  TX: { name: "Texas Board of Nursing", url: "https://www.bon.texas.gov", verification_url: "https://www.bon.texas.gov/forms/verification.asp", notes: "BON verification" },
  VA: { name: "Virginia Board of Nursing", url: "https://www.dhp.virginia.gov/nursing/", verification_url: "https://dhp.virginiainteractive.org/Lookup/Index", notes: "DHP lookup" },
  WA: { name: "Washington Nursing Commission", url: "https://www.doh.wa.gov/LicensesPermitsandCertificates/NursingCommission", verification_url: "https://fortress.wa.gov/doh/providercredentialsearch/", notes: "Provider credential search" },
  WI: { name: "Wisconsin Board of Nursing", url: "https://dsps.wi.gov/pages/BoardsCouncils/Nursing/Default.aspx", verification_url: "https://licenselookup.wi.gov/", notes: "DSPS license lookup" },
};

// CNA Registry directories
const CNA_REGISTRIES: Record<string, { name: string; url: string }> = {
  TX: { name: "Texas NATCEP Registry", url: "https://www.dads.state.tx.us/providers/nf/credentialing/" },
  FL: { name: "Florida CNA Registry", url: "https://appsmqa.doh.state.fl.us/MQASearchServices/HealthCareProviders" },
  CA: { name: "California CDPH Aide & Tech Cert", url: "https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/NurseAideCertification.aspx" },
  NY: { name: "New York Nurse Aide Registry", url: "https://www.prometric.com/nurseaide/ny" },
  OH: { name: "Ohio Nurse Aide Registry", url: "https://nursing.ohio.gov/licensing-certification-ce/ohio-nurse-aide-registry/" },
  PA: { name: "Pennsylvania Nurse Aide Registry", url: "https://www.health.pa.gov/topics/facilities/nursing%20homes/Pages/Nurse-Aide-Registry.aspx" },
  IL: { name: "Illinois Health Care Worker Registry", url: "https://hcwr.ilga.gov/" },
  NC: { name: "NC Division of Health Service Regulation", url: "https://www2.ncdhhs.gov/dhsr/hcpr/" },
  GA: { name: "Georgia CNA Registry", url: "https://sos.ga.gov/PLB/acrobat/Forms/CNA_Verification_Request.pdf" },
  MI: { name: "Michigan Nurse Aide Registry", url: "https://www.michigan.gov/lara/bureau-list/bpl/health/hp-lic-health-prof/nurse-aide" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state")?.toUpperCase();

  if (state) {
    const board = STATE_NURSING_BOARDS[state];
    const cnaRegistry = CNA_REGISTRIES[state];
    return NextResponse.json({
      state,
      nursing_board: board || null,
      cna_registry: cnaRegistry || null,
      tip: board
        ? `Visit ${board.verification_url} to verify licenses and find newly licensed nurses in ${state}.`
        : `No direct board link for ${state}. Search "state board of nursing ${state}" for the lookup portal.`,
    });
  }

  // Return all states
  return NextResponse.json({
    nursing_boards: STATE_NURSING_BOARDS,
    cna_registries: CNA_REGISTRIES,
    total_boards: Object.keys(STATE_NURSING_BOARDS).length,
    total_cna_registries: Object.keys(CNA_REGISTRIES).length,
    tip: "Each state nursing board has a public license verification portal. New license issuances indicate job seekers.",
  });
}
