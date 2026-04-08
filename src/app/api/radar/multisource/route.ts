import { NextRequest, NextResponse } from "next/server";
import { tavilySearch, buildTavilyQueries, parseNameFromResult, parseLocationFromContent } from "@/lib/tavily";
import { STATE_WORKFORCE_URLS, LOCAL_NURSING_PROGRAMS, SOURCE_META } from "@/lib/sources";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "RN";
  const city = searchParams.get("city") || "";
  const state = searchParams.get("state") || "";

  if (!city || !state) {
    return NextResponse.json({ error: "city and state required" }, { status: 400 });
  }

  const queries = buildTavilyQueries(role, city, state);
  const workforce = STATE_WORKFORCE_URLS[state];
  const programs = LOCAL_NURSING_PROGRAMS[state] || [];

  // Run all Tavily searches in parallel
  const searchResults = await Promise.all(
    queries.map(async (q) => {
      let tavResult;
      try {
        tavResult = await tavilySearch(q.query, {
          search_depth: "basic",
          max_results: 5,
        });
      } catch (err) {
        console.error(`Tavily search failed for ${q.source}:`, err);
        tavResult = { results: [], error: String(err) };
      }

      return {
        source: q.source,
        label: q.label,
        error: tavResult.error || null,
        results: (tavResult.results || []).map((r) => {
          const name = parseNameFromResult(r.title);
          const location = parseLocationFromContent(r.content);
          return {
            title: r.title,
            url: r.url,
            snippet: r.content.substring(0, 300),
            score: r.score,
            parsed_name: name,
            parsed_location: location,
            source: q.source,
            source_label: SOURCE_META[q.source]?.label || q.source,
          };
        }),
        total: tavResult.results.length,
        answer: tavResult.answer,
      };
    })
  );

  // Build direct action links
  const roleEncoded = encodeURIComponent(role);
  const locationEncoded = encodeURIComponent(`${city}, ${state}`);

  const directLinks = [
    { source: "indeed", label: "Indeed Job Seekers", url: `https://www.indeed.com/q-${role.replace(/ /g, "-")}-l-${city.replace(/ /g, "-")},-${state}-jobs.html`, icon: "briefcase", priority: "high" },
    { source: "linkedin", label: "LinkedIn Profiles", url: `https://www.linkedin.com/search/results/people/?keywords=${roleEncoded}%20${locationEncoded}`, icon: "linkedin", priority: "high" },
    { source: "google_jobs", label: "Google Jobs", url: `https://www.google.com/search?q=${roleEncoded}+jobs+near+${locationEncoded}&ibp=htl;jobs`, icon: "search", priority: "high" },
    { source: "vivian", label: "Vivian (Travel Nurses)", url: `https://www.vivian.com/search?query=${roleEncoded}&location=${locationEncoded}`, icon: "plane", priority: "high" },
    ...(workforce ? [{ source: "state_workforce", label: workforce.name, url: workforce.search_url, icon: "landmark", priority: "high" as const }] : []),
    { source: "craigslist", label: "Craigslist Healthcare", url: `https://www.craigslist.org/search/hea?query=${roleEncoded}`, icon: "list", priority: "medium" },
    { source: "facebook", label: "Facebook Nursing Groups", url: `https://www.facebook.com/search/groups/?q=${encodeURIComponent("nurses " + state)}`, icon: "users", priority: "medium" },
    { source: "reddit", label: "Reddit r/nursing", url: `https://www.reddit.com/r/nursing/search/?q=${encodeURIComponent(city + " " + state)}&restrict_sr=1`, icon: "message-circle", priority: "medium" },
  ];

  // Count total results found
  const totalResults = searchResults.reduce((sum, r) => sum + r.total, 0);

  return NextResponse.json({
    role,
    city,
    state,
    total_results: totalResults,
    has_tavily: !!process.env.TAVILY_API_KEY,

    // Tavily search results grouped by source
    source_results: searchResults,

    // Direct clickable links
    direct_links: directLinks,

    // Nursing programs
    nursing_programs: programs.map((p) => ({
      ...p,
      tip: `Contact ${p.name} placement office — graduating ${p.programs.join(", ")} students need jobs`,
    })),

    // Workforce agency
    workforce_agency: workforce || null,
  });
}
