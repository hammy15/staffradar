import { NextRequest, NextResponse } from "next/server";
import { buildSearchQueries, STATE_WORKFORCE_URLS, LOCAL_NURSING_PROGRAMS } from "@/lib/sources";

// Multi-source web scraping for candidate discovery
// Uses Google Custom Search JSON API (free: 100/day, $5/1000 after)
// Falls back to constructed search URLs if no API key

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "RN";
  const city = searchParams.get("city") || "";
  const state = searchParams.get("state") || "";

  if (!city || !state) {
    return NextResponse.json({ error: "city and state required" }, { status: 400 });
  }

  const queries = buildSearchQueries(role, city, state);
  const workforce = STATE_WORKFORCE_URLS[state];
  const programs = LOCAL_NURSING_PROGRAMS[state] || [];

  // If Google Custom Search API key is set, actually scrape
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleCx = process.env.GOOGLE_SEARCH_CX;

  const results: Record<string, unknown[]> = {};

  if (googleApiKey && googleCx) {
    // Real web search across multiple sources
    for (const [source, query] of Object.entries(queries)) {
      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=10`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          results[source] = (data.items || []).map((item: Record<string, unknown>) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            source,
          }));
        }
      } catch {
        results[source] = [];
      }
    }
  }

  // Always return search URLs so recruiters can manually scrub these sources
  const searchLinks = Object.entries(queries).map(([source, query]) => ({
    source,
    search_url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    query,
    description: getSourceDescription(source),
  }));

  // Indeed direct search URL
  const indeedUrl = `https://www.indeed.com/q-${role.replace(" ", "-")}-l-${city.replace(" ", "-")},-${state}-jobs.html`;

  // LinkedIn search URL
  const linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(role + " " + city + " " + state)}&origin=GLOBAL_SEARCH_HEADER`;

  // Craigslist
  const craigslistCities: Record<string, string> = {
    ID: "boise", WA: "seattle", OR: "portland", MT: "montana", AZ: "phoenix",
  };
  const clCity = craigslistCities[state] || state.toLowerCase();
  const craigslistUrl = `https://${clCity}.craigslist.org/search/hea?query=${encodeURIComponent(role)}`;

  // Facebook groups search
  const facebookUrl = `https://www.facebook.com/search/groups/?q=${encodeURIComponent("nurses " + state)}`;

  // Reddit
  const redditUrl = `https://www.reddit.com/r/nursing/search/?q=${encodeURIComponent(city + " " + state + " hiring")}&restrict_sr=1`;

  // Travel nurse boards
  const vivianUrl = `https://www.vivian.com/search?query=${encodeURIComponent(role)}&location=${encodeURIComponent(city + ", " + state)}`;

  return NextResponse.json({
    role,
    city,
    state,
    api_results: results,
    has_api_key: !!googleApiKey,

    // Direct action links — recruiters click these to scrub each source
    direct_links: [
      { source: "indeed", label: "Indeed Job Seekers", url: indeedUrl, icon: "briefcase", priority: "high" },
      { source: "linkedin", label: "LinkedIn Profiles", url: linkedinUrl, icon: "linkedin", priority: "high" },
      { source: "google_jobs", label: "Google Jobs", url: `https://www.google.com/search?q=${encodeURIComponent(role + " jobs near " + city + " " + state)}&ibp=htl;jobs`, icon: "search", priority: "high" },
      { source: "craigslist", label: "Craigslist Healthcare", url: craigslistUrl, icon: "list", priority: "medium" },
      { source: "facebook", label: "Facebook Nursing Groups", url: facebookUrl, icon: "users", priority: "medium" },
      { source: "reddit", label: "Reddit r/nursing", url: redditUrl, icon: "message-circle", priority: "medium" },
      { source: "vivian", label: "Vivian (Travel Nurses)", url: vivianUrl, icon: "plane", priority: "high" },
      ...(workforce ? [{ source: "state_workforce", label: workforce.name, url: workforce.search_url, icon: "landmark", priority: "high" as const }] : []),
    ],

    // Google search queries for deeper scrubbing
    search_queries: searchLinks,

    // Local nursing programs to recruit from
    nursing_programs: programs.map((p) => ({
      ...p,
      tip: `Contact ${p.name} placement office — graduating ${p.programs.join(", ")} students need jobs`,
    })),

    // Workforce agency
    workforce_agency: workforce || null,
  });
}

function getSourceDescription(source: string): string {
  const descs: Record<string, string> = {
    indeed: "Active job seekers with published resumes",
    linkedin: "Professional profiles — see experience, credentials, connections",
    facebook: "Community groups where people post about job searches",
    reddit: "r/nursing and r/cna — people openly discussing job seeking",
    craigslist: "Healthcare job wanted postings — often CNAs and aides",
    google_jobs: "Aggregated active job seekers from multiple platforms",
    travel_nurse: "Travel nursing assignment boards — active travelers",
  };
  return descs[source] || "";
}
