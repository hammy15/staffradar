// Tavily Search API — web scraping for AI agents

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

export async function tavilySearch(query: string, options?: {
  search_depth?: "basic" | "advanced";
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
}): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { results: [] };

  const body: Record<string, unknown> = {
    api_key: apiKey,
    query,
    search_depth: options?.search_depth || "basic",
    max_results: options?.max_results || 10,
    include_answer: true,
  };
  // Only add domain filters if explicitly provided — empty arrays cause issues
  if (options?.include_domains && options.include_domains.length > 0) {
    body.include_domains = options.include_domains;
  }
  if (options?.exclude_domains && options.exclude_domains.length > 0) {
    body.exclude_domains = options.exclude_domains;
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Tavily error:", res.status, await res.text());
    return { results: [] };
  }

  return res.json();
}

// Parse a name from a search result title
export function parseNameFromResult(title: string): { first_name: string; last_name: string } | null {
  // Common patterns: "John Smith - Registered Nurse", "John Smith, RN", "John Smith | LinkedIn"
  const cleaned = title
    .replace(/\s*[-|–—]\s*.*/g, "") // Remove everything after dash/pipe
    .replace(/,\s*(RN|LPN|CNA|BSN|MSN|DNP|NP|APRN|LVN).*/gi, "") // Remove credentials
    .replace(/\s*\(.*\)/g, "") // Remove parentheticals
    .trim();

  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return {
      first_name: parts[0],
      last_name: parts.slice(1).join(" "),
    };
  }
  return null;
}

// Extract location from search result content
export function parseLocationFromContent(content: string): { city?: string; state?: string } {
  // Look for "City, ST" pattern
  const stateAbbrevs = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY";
  const match = content.match(new RegExp(`([A-Z][a-z]+(?:\\s[A-Z][a-z]+)?),\\s*(${stateAbbrevs})`, "i"));
  if (match) {
    return { city: match[1], state: match[2].toUpperCase() };
  }
  return {};
}

// Build search queries for each source type
export function buildTavilyQueries(role: string, city: string, state: string): Array<{
  source: string;
  query: string;
  domains?: string[];
  label: string;
}> {
  const roleTerms: Record<string, string> = {
    RN: "registered nurse",
    CNA: "certified nursing assistant CNA",
    LPN: "licensed practical nurse LPN",
    "Med Tech": "medical technologist",
    Cook: "institutional cook dietary",
    "Dietary Aid": "dietary aide food service",
  };
  const term = roleTerms[role] || role;

  return [
    {
      source: "indeed",
      query: `${term} jobs ${city} ${state} site:indeed.com`,
      label: "Indeed",
    },
    {
      source: "linkedin",
      query: `${term} ${city} ${state} site:linkedin.com/in`,
      label: "LinkedIn Profiles",
    },
    {
      source: "google_jobs",
      query: `${term} hiring ${city} ${state} apply now`,
      label: "Job Postings",
    },
    {
      source: "travel_nurse_boards",
      query: `travel ${term} ${city} ${state} site:vivian.com OR site:nomadhealth.com`,
      label: "Travel Nurse Boards",
    },
    {
      source: "nursing_schools",
      query: `nursing CNA program ${city} ${state} graduates hiring`,
      label: "Nursing Programs",
    },
    {
      source: "facebook_groups",
      query: `${term} ${city} ${state} hiring jobs group site:facebook.com`,
      label: "Facebook",
    },
    {
      source: "craigslist",
      query: `${term} ${city} ${state} site:craigslist.org`,
      label: "Craigslist",
    },
    {
      source: "state_workforce",
      query: `${term} ${city} ${state} workforce jobs department of labor`,
      label: "State Workforce",
    },
  ];
}
