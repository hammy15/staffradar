"use client";

import { useState } from "react";
import {
  Search, ExternalLink, Loader2, Briefcase, Users, MapPin,
  MessageCircle, GraduationCap, Landmark, Lightbulb,
  Globe, ChevronDown, ChevronUp, Plane, List, Star, Link2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ROLE_TYPES, US_STATES } from "@/lib/types";
import { UNCONVENTIONAL_SOURCES } from "@/lib/sources";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
  parsed_name: { first_name: string; last_name: string } | null;
  parsed_location: { city?: string; state?: string };
  source: string;
  source_label: string;
}

interface SourceGroup {
  source: string;
  label: string;
  results: SearchResult[];
  total: number;
  answer?: string;
}

interface DirectLink {
  source: string; label: string; url: string; icon: string; priority: string;
}

interface NursingProgram {
  name: string; city: string; state: string; programs: string[]; url: string; tip: string;
}

interface MultiSourceResult {
  role: string; city: string; state: string; total_results: number; has_tavily: boolean;
  source_results: SourceGroup[];
  direct_links: DirectLink[];
  nursing_programs: NursingProgram[];
  workforce_agency: { name: string; url: string; search_url: string } | null;
}

const ICON_MAP: Record<string, typeof Briefcase> = {
  briefcase: Briefcase, linkedin: Link2, search: Search, list: List,
  users: Users, "message-circle": MessageCircle, plane: Plane, landmark: Landmark,
};

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  indeed: { bg: "#eef4ff", text: "#2164f3" },
  linkedin: { bg: "#e8f4fd", text: "#0077b5" },
  google_jobs: { bg: "#e8f0fe", text: "#4285f4" },
  travel_nurse_boards: { bg: "#f0eeff", text: "#8b5cf6" },
  nursing_schools: { bg: "#e6f5ec", text: "#059669" },
  facebook_groups: { bg: "#e8f0fe", text: "#1877f2" },
  craigslist: { bg: "#f0eeff", text: "#5b3ab5" },
  state_workforce: { bg: "#f0eeff", text: "#6366f1" },
};

export default function SourcesPage() {
  const { buildings } = useAppStore();
  const [role, setRole] = useState("RN");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [result, setResult] = useState<MultiSourceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [showUnconventional, setShowUnconventional] = useState(false);

  function selectBuilding(id: string) {
    const b = buildings.find((b) => b.id === id);
    if (b) { setCity(b.city); setState(b.state); }
  }

  async function handleSearch() {
    if (!city || !state) return;
    setLoading(true);
    const res = await fetch(`/api/radar/multisource?role=${role}&city=${encodeURIComponent(city)}&state=${state}`);
    if (res.ok) setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold">Multi-Source Discovery</h2>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Real-time web scraping across job boards, LinkedIn, state agencies, and more
        </p>
      </div>

      {/* Search Config */}
      <div className="glass rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px]">
              {ROLE_TYPES.slice(0, 8).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Boise" className="w-full px-3 py-2 rounded-lg text-[13px]" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">State</label>
            <select value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px]">
              <option value="">Select</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={loading || !city || !state}
              className="w-full py-2 rounded-lg font-semibold text-sm text-white transition disabled:opacity-40"
              style={{ background: "var(--teal)" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Scrub All Sources"}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[11px] text-[var(--text-muted)] py-1">Quick:</span>
          {buildings.filter((b) => b.type === "SNF").slice(0, 10).map((b) => (
            <button key={b.id} onClick={() => selectBuilding(b.id)}
              className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--teal-light)] hover:text-[var(--teal)] transition">
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Summary banner */}
          <div className="glass rounded-xl p-4 flex items-center justify-between"
            style={{ borderLeft: "3px solid var(--teal)" }}>
            <div>
              <span className="font-semibold">{result.total_results} results</span>
              <span className="text-[var(--text-muted)] text-sm ml-2">
                scraped across {result.source_results.filter((s) => s.total > 0).length} sources for {result.role}s in {result.city}, {result.state}
              </span>
            </div>
            {result.has_tavily && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--green-light)", color: "var(--green)" }}>
                LIVE SCRAPING
              </span>
            )}
          </div>

          {/* Scraped Results by Source */}
          {result.source_results.filter((s) => s.total > 0).map((group) => {
            const colors = SOURCE_COLORS[group.source] || { bg: "#f0f2f5", text: "#64748b" };
            const isExpanded = expandedSource === group.source;
            return (
              <div key={group.source} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSource(isExpanded ? null : group.source)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-subtle)] transition text-left"
                >
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: colors.bg, color: colors.text }}>
                    {group.label}
                  </span>
                  <span className="text-sm font-medium">{group.total} results found</span>
                  {group.answer && <span className="text-[12px] text-[var(--text-muted)] flex-1 truncate ml-2">{group.answer}</span>}
                  <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--border)] divide-y divide-[var(--border-light)]">
                    {group.results.map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start gap-3 p-4 hover:bg-[var(--bg-subtle)] transition">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                          style={{ background: colors.bg, color: colors.text }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[var(--text)] line-clamp-1">{r.title}</div>
                          <div className="text-[11px] text-[var(--teal)] truncate mt-0.5">{r.url}</div>
                          <div className="text-[12px] text-[var(--text-secondary)] mt-1 line-clamp-2">{r.snippet}</div>
                          {r.parsed_name && (
                            <div className="text-[11px] text-[var(--text-muted)] mt-1">
                              Possible candidate: <strong>{r.parsed_name.first_name} {r.parsed_name.last_name}</strong>
                              {r.parsed_location.city && ` — ${r.parsed_location.city}, ${r.parsed_location.state}`}
                            </div>
                          )}
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-1" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Direct Links */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3">Direct Search Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.direct_links.map((link) => {
                const Icon = ICON_MAP[link.icon] || Globe;
                return (
                  <a key={link.source} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-lg border transition hover:shadow-sm ${
                      link.priority === "high" ? "border-[var(--teal)] bg-[var(--teal-light)]" : "border-[var(--border)]"
                    }`}>
                    <Icon className={`w-4 h-4 shrink-0 ${link.priority === "high" ? "text-[var(--teal)]" : "text-[var(--text-muted)]"}`} />
                    <span className="text-[13px] font-medium flex-1">{link.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Nursing Programs */}
          {result.nursing_programs.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[var(--green)]" /> Local Nursing Programs
              </h3>
              <div className="space-y-2">
                {result.nursing_programs.map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--teal)] transition">
                    <GraduationCap className="w-4 h-4 text-[var(--green)] shrink-0" />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{p.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{p.city}, {p.state} — {p.programs.join(", ")}</div>
                      <div className="text-[11px] text-[var(--teal)] mt-0.5">{p.tip}</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unconventional Sources */}
      <div className="glass rounded-xl overflow-hidden">
        <button onClick={() => setShowUnconventional(!showUnconventional)}
          className="w-full flex items-center justify-between p-5 hover:bg-[var(--bg-subtle)] transition">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[var(--amber)]" />
            <span className="font-semibold text-sm">Unconventional Recruiting Sources</span>
            <span className="text-[11px] text-[var(--text-muted)]">({UNCONVENTIONAL_SOURCES.length} methods)</span>
          </div>
          {showUnconventional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showUnconventional && (
          <div className="px-5 pb-5 space-y-3 border-t border-[var(--border)]">
            {UNCONVENTIONAL_SOURCES.map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--bg-subtle)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[13px]">{s.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${
                    s.effort === "low" ? "bg-[var(--green-light)] text-[var(--green)]" :
                    s.effort === "medium" ? "bg-[var(--amber-light)] text-[var(--amber)]" :
                    "bg-[var(--rose-light)] text-[var(--rose)]"
                  }`}>{s.effort} effort</span>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)]">{s.description}</p>
                <p className="text-[11px] text-[var(--teal)] mt-1 font-medium">{s.tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
