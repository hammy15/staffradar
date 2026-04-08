"use client";

import { useState } from "react";
import {
  Search, ExternalLink, Loader2, Briefcase, Users, MapPin,
  MessageCircle, GraduationCap, Landmark, Star, Lightbulb,
  Globe, Zap, ChevronDown, ChevronUp, Plane, List,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ROLE_TYPES, US_STATES } from "@/lib/types";
import { UNCONVENTIONAL_SOURCES } from "@/lib/sources";

interface DirectLink {
  source: string;
  label: string;
  url: string;
  icon: string;
  priority: string;
}

interface NursingProgram {
  name: string;
  city: string;
  state: string;
  programs: string[];
  url: string;
  tip: string;
}

interface MultiSourceResult {
  role: string;
  city: string;
  state: string;
  direct_links: DirectLink[];
  nursing_programs: NursingProgram[];
  workforce_agency: { name: string; url: string; search_url: string } | null;
}

const ICON_MAP: Record<string, typeof Briefcase> = {
  briefcase: Briefcase,
  linkedin: Globe,
  search: Search,
  list: List,
  users: Users,
  "message-circle": MessageCircle,
  plane: Plane,
  landmark: Landmark,
};

export default function SourcesPage() {
  const { buildings } = useAppStore();
  const [role, setRole] = useState("RN");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [result, setResult] = useState<MultiSourceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUnconventional, setShowUnconventional] = useState(false);

  // Auto-fill from building selection
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">Multi-Source Discovery</h2>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Scrub job boards, LinkedIn, state agencies, nursing schools, and unconventional sources — all from one place
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Scan All Sources"}
            </button>
          </div>
        </div>

        {/* Quick building selector */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-[11px] text-[var(--text-muted)] py-1">Quick fill:</span>
          {buildings.filter((b) => b.type === "SNF").slice(0, 8).map((b) => (
            <button key={b.id} onClick={() => selectBuilding(b.id)}
              className="text-[11px] px-2 py-1 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--teal-light)] hover:text-[var(--teal)] transition">
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-slide-up">
          {/* Direct Source Links — the main action panel */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold mb-1">Live Source Links for {result.role}s near {result.city}, {result.state}</h3>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">Click each link to scrub that source. Find candidates, then add them to your pipeline.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.direct_links.map((link) => {
                const Icon = ICON_MAP[link.icon] || Globe;
                return (
                  <a key={link.source} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-lg border transition hover:shadow-sm ${
                      link.priority === "high"
                        ? "border-[var(--teal)] bg-[var(--teal-light)]"
                        : "border-[var(--border)] hover:border-[var(--teal)]"
                    }`}>
                    <Icon className={`w-4 h-4 shrink-0 ${link.priority === "high" ? "text-[var(--teal)]" : "text-[var(--text-muted)]"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">{link.label}</div>
                    </div>
                    {link.priority === "high" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--teal)] text-white font-semibold uppercase">High</span>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Nursing Programs */}
          {result.nursing_programs.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[var(--teal)]" />
                Local Nursing Programs
              </h3>
              <p className="text-[12px] text-[var(--text-muted)] mb-3">Recent graduates are actively job seeking. Contact placement offices.</p>
              <div className="space-y-2">
                {result.nursing_programs.map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--teal)] transition">
                    <GraduationCap className="w-4 h-4 text-[var(--green)] shrink-0" />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{p.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        <MapPin className="w-3 h-3 inline mr-0.5" />{p.city}, {p.state} — {p.programs.join(", ")}
                      </div>
                      <div className="text-[11px] text-[var(--teal)] mt-0.5">{p.tip}</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* State Workforce Agency */}
          {result.workforce_agency && (
            <a href={result.workforce_agency.search_url} target="_blank" rel="noopener noreferrer"
              className="glass rounded-xl p-5 flex items-center gap-4 hover:border-[var(--teal)] transition block">
              <Landmark className="w-5 h-5 text-[#6366f1]" />
              <div>
                <div className="font-semibold text-sm">{result.workforce_agency.name}</div>
                <div className="text-[12px] text-[var(--text-muted)]">State workforce development — free candidate referrals and training subsidies</div>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-muted)] ml-auto shrink-0" />
            </a>
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
          <div className="px-5 pb-5 space-y-3">
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

      {/* Data Source Legend */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-3">Where Does Candidate Data Come From?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
          {[
            { badge: "NPI Registry", color: "#2a7c7c", bg: "#e6f3f3", desc: "Federal NPPES database — name, NPI, license, practice address, phone. Real licensed providers." },
            { badge: "Indeed", color: "#2164f3", bg: "#eef4ff", desc: "Job seekers who published resumes. Active candidates looking for work." },
            { badge: "LinkedIn", color: "#0077b5", bg: "#e8f4fd", desc: "Professional profiles found via web search. Experience, credentials, connections." },
            { badge: "State Workforce", color: "#6366f1", bg: "#f0eeff", desc: "State employment agency referrals. Often subsidized training available." },
            { badge: "Travel Boards", color: "#8b5cf6", bg: "#f0eeff", desc: "Vivian, Aya, NomadHealth — active travel nurses seeking assignments." },
            { badge: "Nursing Schools", color: "#059669", bg: "#e6f5ec", desc: "Recent graduates from local programs. Contact placement offices directly." },
            { badge: "CMS Compare", color: "#1e5e5e", bg: "#e6f3f3", desc: "CMS Care Compare — competing facility staffing and quality data." },
            { badge: "Military", color: "#365314", bg: "#ecfccb", desc: "DOD SkillBridge — transitioning medics, corpsmen, military nurses." },
            { badge: "Manual", color: "#64748b", bg: "#f0f2f5", desc: "Added manually by your recruiters — referrals, walk-ins, career fairs." },
          ].map((s) => (
            <div key={s.badge} className="flex items-start gap-2 p-2 rounded-lg">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5" style={{ background: s.bg, color: s.color }}>
                {s.badge}
              </span>
              <span className="text-[var(--text-secondary)]">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
