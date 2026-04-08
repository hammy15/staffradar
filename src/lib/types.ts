export type BuildingType = "SNF" | "ALF" | "HH" | "Hospice";

export interface Building {
  id: string;
  name: string;
  type: BuildingType;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export type CandidateStatus =
  | "discovered"
  | "researched"
  | "contacted"
  | "responded"
  | "interested"
  | "interviewing"
  | "offered"
  | "hired"
  | "declined"
  | "not_interested";

export interface Candidate {
  id: string;
  npi: string | null;
  first_name: string;
  last_name: string;
  credentials: string | null;
  role_type: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source: string;
  source_detail: string | null;
  status: CandidateStatus;
  building_id: string | null;
  assigned_to: string | null;
  willingness_to_relocate: boolean;
  is_traveler: boolean;
  current_employer: string | null;
  license_state: string | null;
  license_number: string | null;
  notes: string | null;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Outreach {
  id: string;
  candidate_id: string;
  user_id: string | null;
  type: "sms" | "email" | "call" | "linkedin" | "other";
  subject: string | null;
  content: string | null;
  response: string | null;
  sent_at: string;
  responded_at: string | null;
}

export interface CompetingFacility {
  id: string;
  cms_id: string | null;
  name: string;
  type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  overall_rating: number | null;
  staffing_rating: number | null;
  rn_staffing_hours: number | null;
  total_nurse_staffing_hours: number | null;
  aide_staffing_hours: number | null;
  total_beds: number | null;
  occupancy_rate: number | null;
  building_id: string | null;
  last_updated: string;
}

export interface User {
  id: string;
  name: string;
  role: "admin" | "recruiter";
  building_id: string | null;
  last_login: string;
  created_at: string;
}

export interface NpiResult {
  number: string;
  basic: {
    first_name: string;
    last_name: string;
    credential: string;
    sole_proprietor: string;
    gender: string;
    enumeration_date: string;
    last_updated: string;
    status: string;
    name_prefix: string;
  };
  addresses: Array<{
    country_code: string;
    country_name: string;
    address_purpose: string;
    address_type: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postal_code: string;
    telephone_number: string;
    fax_number: string;
  }>;
  taxonomies: Array<{
    code: string;
    taxonomy_group: string;
    desc: string;
    state: string;
    license: string;
    primary: boolean;
  }>;
}

export interface NpiSearchParams {
  taxonomy_description?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  enumeration_type?: "NPI-1" | "NPI-2";
  limit?: number;
  skip?: number;
}

export const ROLE_TYPES = [
  "RN",
  "CNA",
  "LPN",
  "Med Tech",
  "Cook",
  "Dietary Aid",
  "Physical Therapist",
  "Occupational Therapist",
  "Speech Therapist",
  "Social Worker",
  "Activities Director",
  "Housekeeping",
  "Maintenance",
] as const;

export const NPI_TAXONOMY_MAP: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Nurse Aide",
  "Med Tech": "Medical Technologist",
  "Physical Therapist": "Physical Therapist",
  "Occupational Therapist": "Occupational Therapist",
  "Speech Therapist": "Speech-Language Pathologist",
  "Social Worker": "Social Worker",
};

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  SNF: "Skilled Nursing Facility",
  ALF: "Assisted Living Facility",
  HH: "Home Health",
  Hospice: "Hospice",
};

export const STATUS_COLORS: Record<CandidateStatus, string> = {
  discovered: "bg-zinc-100 text-zinc-700",
  researched: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  responded: "bg-purple-100 text-purple-700",
  interested: "bg-emerald-100 text-emerald-700",
  interviewing: "bg-cyan-100 text-cyan-700",
  offered: "bg-orange-100 text-orange-700",
  hired: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
  not_interested: "bg-zinc-200 text-zinc-500",
};

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;
