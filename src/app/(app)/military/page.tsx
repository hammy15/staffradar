"use client";

import { useState } from "react";
import {
  Shield, MapPin, Search, Loader2, ArrowRight, Users,
  Briefcase, Star, ExternalLink,
} from "lucide-react";
import { ROLE_TYPES, US_STATES } from "@/lib/types";

interface MilitaryBase {
  name: string;
  state: string;
  city: string;
  specialties: string[];
  matching_specialties: string[];
  relevance: string;
  crosswalk: Array<{ military: string; civilian_roles: string[] }>;
  tip: string;
}

interface MilitaryResult {
  bases: MilitaryBase[];
  total: number;
  tip: string;
  role_crosswalk?: Record<string, string[]>;
}

export default function MilitaryPage() {
  const [state, setState] = useState("");
  const [roleType, setRoleType] = useState("");
  const [result, setResult] = useState<MilitaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (roleType) params.set("role_type", roleType);

    const res = await fetch(`/api/radar/military?${params.toString()}`);
    if (res.ok) setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-sky-500" />
          Military Transition Pipeline
        </h2>
        <p className="text-muted mt-1">
          Find military bases with medical personnel separating into civilian healthcare careers.
          DOD SkillBridge allows service members to work 180 days before separation.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-sky-50 rounded-2xl border border-sky-200 p-5">
        <h3 className="font-semibold text-sky-800 mb-2">Why Military Recruiting Works</h3>
        <ul className="space-y-1.5 text-sm text-sky-700">
          <li className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-0.5 shrink-0" />
            <span>68W Combat Medics have 1,000+ hours of clinical training — they map to CNA/Med Tech roles</span>
          </li>
          <li className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Navy Corpsmen (HM) have extensive bedside care experience — map to CNA/LPN</span>
          </li>
          <li className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-0.5 shrink-0" />
            <span>SkillBridge lets them intern for 6 months before discharge — free trial period</span>
          </li>
          <li className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Contact base SFL-TAP (Soldier for Life) offices for direct introductions</span>
          </li>
        </ul>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">State (optional)</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All States</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Civilian Role Needed</label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Roles</option>
              {ROLE_TYPES.slice(0, 6).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 stagger-children">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{result.total} bases found</span>
          </div>

          {result.bases.map((base, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl border p-5 ${
                base.relevance === "high" ? "border-emerald-200 bg-emerald-50/30" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{base.name}</h3>
                    {base.relevance === "high" && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        High Match
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {base.city}, {base.state}
                  </div>
                </div>
              </div>

              {/* MOS Crosswalk */}
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium">Medical Specialties at This Base</h4>
                {base.crosswalk.map((cw, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      base.matching_specialties.includes(cw.military)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}>
                      {cw.military}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted" />
                    <span className="text-muted">
                      {cw.civilian_roles.length > 0 ? cw.civilian_roles.join(", ") : "Various"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Tip */}
              <div className="bg-slate-50 rounded-xl p-3 text-sm text-muted">
                <Briefcase className="w-4 h-4 inline mr-1" />
                {base.tip}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!result && !loading && (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-lg mb-2">Search Military Bases</h3>
          <p className="text-muted max-w-md mx-auto">
            Find bases with medical personnel near your facilities. Each year, thousands of
            combat medics and corpsmen transition to civilian healthcare.
          </p>
        </div>
      )}
    </div>
  );
}
