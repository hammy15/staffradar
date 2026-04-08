// Multi-Source Intelligence Engine
// Each source has a search function that returns standardized candidate data

export interface SourceResult {
  source: string;
  source_detail: string;
  source_url?: string;
  first_name: string;
  last_name: string;
  role_type: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  credentials?: string;
  current_employer?: string;
  snippet?: string; // context from where we found them
}

export const SOURCE_META: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}> = {
  npi_registry: {
    label: "NPI Registry",
    color: "#2a7c7c",
    bgColor: "#e6f3f3",
    icon: "shield",
    description: "Federal NPI database — every licensed provider in the US",
  },
  radar_sweep: {
    label: "Radar Sweep",
    color: "#2a7c7c",
    bgColor: "#e6f3f3",
    icon: "radar",
    description: "Automated NPI scan for building area",
  },
  indeed: {
    label: "Indeed",
    color: "#2164f3",
    bgColor: "#eef4ff",
    icon: "briefcase",
    description: "Job seekers with resumes on Indeed",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0077b5",
    bgColor: "#e8f4fd",
    icon: "linkedin",
    description: "Professional profiles found via web search",
  },
  google_jobs: {
    label: "Google Jobs",
    color: "#4285f4",
    bgColor: "#e8f0fe",
    icon: "search",
    description: "Active job seekers aggregated by Google",
  },
  state_workforce: {
    label: "State Workforce",
    color: "#6366f1",
    bgColor: "#f0eeff",
    icon: "landmark",
    description: "State workforce development agency listings",
  },
  nursing_schools: {
    label: "Nursing Schools",
    color: "#059669",
    bgColor: "#e6f5ec",
    icon: "graduation-cap",
    description: "Recent graduates from local nursing programs",
  },
  reddit: {
    label: "Reddit",
    color: "#ff4500",
    bgColor: "#fff0eb",
    icon: "message-circle",
    description: "r/nursing, r/cna — people posting about job searches",
  },
  facebook_groups: {
    label: "Facebook Groups",
    color: "#1877f2",
    bgColor: "#e8f0fe",
    icon: "users",
    description: "Healthcare worker community groups",
  },
  travel_nurse_boards: {
    label: "Travel Boards",
    color: "#8b5cf6",
    bgColor: "#f0eeff",
    icon: "plane",
    description: "Travel nursing assignment boards (Vivian, Aya, etc.)",
  },
  craigslist: {
    label: "Craigslist",
    color: "#5b3ab5",
    bgColor: "#f0eeff",
    icon: "list",
    description: "Healthcare job wanted postings",
  },
  staffing_agencies: {
    label: "Staffing Agency",
    color: "#d4840a",
    bgColor: "#fef3e2",
    icon: "building",
    description: "Local healthcare staffing agency candidates",
  },
  cms_compare: {
    label: "CMS Compare",
    color: "#1e5e5e",
    bgColor: "#e6f3f3",
    icon: "database",
    description: "CMS Care Compare staffing data",
  },
  military_transition: {
    label: "Military",
    color: "#365314",
    bgColor: "#ecfccb",
    icon: "shield",
    description: "Transitioning service members (SkillBridge/TAP)",
  },
  manual: {
    label: "Manual Entry",
    color: "#64748b",
    bgColor: "#f0f2f5",
    icon: "edit",
    description: "Manually added by recruiter",
  },
  referral: {
    label: "Referral",
    color: "#c53838",
    bgColor: "#fde8e8",
    icon: "heart",
    description: "Employee or candidate referral",
  },
};

// Google search query builders for each source
export function buildSearchQueries(role: string, city: string, state: string): Record<string, string> {
  const roleTerms: Record<string, string[]> = {
    RN: ["registered nurse", "RN", "BSN"],
    CNA: ["certified nursing assistant", "CNA", "nurse aide"],
    LPN: ["licensed practical nurse", "LPN", "LVN"],
    "Med Tech": ["medical technologist", "med tech", "clinical lab tech"],
    Cook: ["institutional cook", "dietary cook", "healthcare cook"],
    "Dietary Aid": ["dietary aide", "food service", "nutrition aide"],
  };
  const terms = roleTerms[role] || [role.toLowerCase()];
  const location = `"${city}" "${state}"`;

  return {
    indeed: `site:indeed.com/r ${terms[0]} ${location}`,
    linkedin: `site:linkedin.com/in ${terms[0]} ${location}`,
    facebook: `site:facebook.com "${terms[0]}" ${location} "looking for" OR "seeking" OR "available"`,
    reddit: `site:reddit.com/r/nursing OR site:reddit.com/r/cna ${terms[0]} ${city} ${state}`,
    craigslist: `site:craigslist.org ${terms[0]} ${location} "resume"`,
    google_jobs: `${terms[0]} jobs near ${city}, ${state} "seeking employment"`,
    travel_nurse: `site:vivian.com OR site:nomadhealth.com ${terms[0]} ${city} ${state}`,
  };
}

// State workforce agency URLs
export const STATE_WORKFORCE_URLS: Record<string, { name: string; url: string; search_url: string }> = {
  ID: { name: "Idaho Department of Labor", url: "https://www.labor.idaho.gov", search_url: "https://idahoworks.gov/search" },
  WA: { name: "Washington WorkSource", url: "https://www.worksourcewa.com", search_url: "https://www.worksourcewa.com/microsite/Content.aspx?appid=WAABORUI&pagetype=simple&sID=100&SortBy=Best+Match" },
  OR: { name: "Oregon Employment Department", url: "https://www.oregon.gov/employ", search_url: "https://www.qualityinfo.org" },
  MT: { name: "Montana Department of Labor", url: "https://wsd.dli.mt.gov", search_url: "https://montanaworks.gov" },
  AZ: { name: "Arizona DES", url: "https://des.az.gov", search_url: "https://www.azjobconnection.gov" },
};

// Nursing school programs near Cascadia facilities
export const LOCAL_NURSING_PROGRAMS: Record<string, Array<{ name: string; city: string; state: string; programs: string[]; url: string }>> = {
  ID: [
    { name: "Boise State University", city: "Boise", state: "ID", programs: ["BSN", "RN-BSN", "MSN"], url: "https://www.boisestate.edu/nursing/" },
    { name: "Idaho State University", city: "Pocatello", state: "ID", programs: ["BSN", "LPN", "MSN", "DNP"], url: "https://www.isu.edu/nursing/" },
    { name: "Lewis-Clark State College", city: "Lewiston", state: "ID", programs: ["BSN", "RN-BSN"], url: "https://www.lcsc.edu/nursing" },
    { name: "North Idaho College", city: "Coeur d'Alene", state: "ID", programs: ["RN", "CNA"], url: "https://www.nic.edu/nursing/" },
    { name: "College of Western Idaho", city: "Nampa", state: "ID", programs: ["RN", "CNA", "Phlebotomy"], url: "https://cwi.edu/program/nursing" },
    { name: "College of Southern Idaho", city: "Twin Falls", state: "ID", programs: ["RN", "CNA", "LPN"], url: "https://www.csi.edu/nursing/" },
    { name: "College of Eastern Idaho", city: "Idaho Falls", state: "ID", programs: ["CNA", "LPN"], url: "https://www.cei.edu" },
  ],
  WA: [
    { name: "Washington State University", city: "Spokane", state: "WA", programs: ["BSN", "MSN", "DNP"], url: "https://nursing.wsu.edu" },
    { name: "Western Washington University", city: "Bellingham", state: "WA", programs: ["BSN", "Pre-nursing"], url: "https://www.wwu.edu" },
    { name: "Whatcom Community College", city: "Bellingham", state: "WA", programs: ["RN", "CNA"], url: "https://www.whatcom.edu/nursing" },
    { name: "Skagit Valley College", city: "Mount Vernon", state: "WA", programs: ["RN", "CNA"], url: "https://www.skagit.edu/nursing" },
    { name: "Clark College", city: "Vancouver", state: "WA", programs: ["RN", "CNA", "LPN"], url: "https://www.clark.edu/nursing" },
    { name: "Spokane Community College", city: "Spokane", state: "WA", programs: ["RN", "CNA", "LPN"], url: "https://scc.spokane.edu" },
    { name: "Walla Walla Community College", city: "Clarkston", state: "WA", programs: ["RN", "CNA"], url: "https://www.wwcc.edu" },
  ],
  OR: [
    { name: "Oregon Health & Science University", city: "Portland", state: "OR", programs: ["BSN", "MSN", "DNP"], url: "https://www.ohsu.edu/school-of-nursing" },
    { name: "Mt. Hood Community College", city: "Gresham", state: "OR", programs: ["RN", "CNA"], url: "https://www.mhcc.edu/nursing" },
    { name: "Lane Community College", city: "Eugene", state: "OR", programs: ["RN", "CNA"], url: "https://www.lanecc.edu" },
    { name: "Southwestern Oregon CC", city: "Coos Bay", state: "OR", programs: ["RN", "CNA"], url: "https://www.socc.edu" },
  ],
  MT: [
    { name: "Montana State University", city: "Bozeman", state: "MT", programs: ["BSN", "MSN"], url: "https://www.montana.edu/nursing/" },
    { name: "Flathead Valley CC", city: "Kalispell", state: "MT", programs: ["RN", "CNA"], url: "https://www.fvcc.edu" },
    { name: "Helena College", city: "Helena", state: "MT", programs: ["CNA", "LPN"], url: "https://www.helenacollege.edu" },
  ],
  AZ: [
    { name: "Arizona State University", city: "Phoenix", state: "AZ", programs: ["BSN", "MSN", "DNP"], url: "https://nursingandhealth.asu.edu" },
    { name: "Maricopa Community Colleges", city: "Phoenix", state: "AZ", programs: ["RN", "CNA", "LPN"], url: "https://www.maricopa.edu/nursing" },
    { name: "GateWay Community College", city: "Phoenix", state: "AZ", programs: ["RN", "CNA"], url: "https://www.gatewaycc.edu" },
  ],
};

// Unconventional recruitment channels
export const UNCONVENTIONAL_SOURCES = [
  {
    name: "Church Bulletin Boards",
    description: "Many churches post job opportunities. Contact local churches near your building to post nursing opportunities on their physical and digital bulletin boards.",
    tip: "Hispanic and Filipino churches are especially effective — these communities have high nursing participation rates.",
    effort: "low",
  },
  {
    name: "Refugee Resettlement Agencies",
    description: "Many refugees were healthcare professionals in their home countries. Local IRC and USCRI offices can connect you to credentialed refugees seeking healthcare employment.",
    tip: "Contact Idaho IRC (Boise), Lutheran Immigration (all states), Catholic Charities.",
    effort: "medium",
  },
  {
    name: "Prison Reentry CNA Programs",
    description: "Many state prisons run CNA certification programs. Corrections departments can connect you to graduates reentering the workforce.",
    tip: "Idaho Dept of Corrections has an active CNA program. Contact their reentry coordinator.",
    effort: "medium",
  },
  {
    name: "High School CNA Programs",
    description: "Many high schools offer CNA certification as part of health science pathways. Graduating students are job-ready.",
    tip: "Contact the Career Technical Education (CTE) department at local school districts.",
    effort: "low",
  },
  {
    name: "Community College Job Fairs",
    description: "Nursing program job fairs happen 2-3x per year. Get on the list to exhibit — you'll meet graduating nurses actively looking.",
    tip: "CWI (Nampa), NIC (CDA), CSI (Twin Falls) all have nursing career events.",
    effort: "medium",
  },
  {
    name: "Foreign-Trained Nurses",
    description: "CGFNS (Commission on Graduates of Foreign Nursing Schools) maintains a database of internationally educated nurses seeking US employment.",
    tip: "Philippines, India, Nigeria, and Jamaica are top countries. Many are already in your state on other visas.",
    effort: "high",
  },
  {
    name: "Nextdoor App",
    description: "Hyperlocal — post in neighborhoods near your building. Many CNAs and home health aides use Nextdoor to find local work.",
    tip: "Post as a business, not personal. Mention walking-distance opportunity.",
    effort: "low",
  },
  {
    name: "Laundromat & Grocery Store Boards",
    description: "Physical job boards at laundromats, grocery stores, and community centers in working-class neighborhoods near your facilities.",
    tip: "CNAs and dietary aides often don't use online job boards. Meet them where they are.",
    effort: "low",
  },
  {
    name: "Workforce Development Boards",
    description: "Every region has a WDB that helps unemployed/underemployed people find jobs. They can refer candidates and even pay for CNA training.",
    tip: "Idaho Commerce WDB, WorkSource WA, Oregon Workforce Partnership.",
    effort: "medium",
  },
  {
    name: "Local Buy/Sell/Trade Facebook Groups",
    description: "Not just job groups — general community Facebook groups often have people posting 'looking for work' or 'anyone hiring?'",
    tip: "Search '[City] Buy Sell Trade', '[City] Community', 'Boise Moms' etc.",
    effort: "low",
  },
];
