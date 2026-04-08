"use client";

import { useState } from "react";
import {
  TrendingUp, Search, Loader2, BarChart3, Users, DollarSign,
  ExternalLink, MapPin,
} from "lucide-react";
import { ROLE_TYPES, US_STATES } from "@/lib/types";

interface WorkforceData {
  state: string;
  available: boolean;
  message?: string;
  bls_link?: string;
  role?: string;
  soc_code?: string;
  soc_title?: string;
  per_1000?: number;
  total?: number;
  avg_salary?: number;
  interpretation?: string;
  roles?: Array<{
    role: string;
    soc_code: string;
    soc_title: string;
    per_1000: number;
    total: number;
    avg_salary: number;
  }>;
}

export default function WorkforcePage() {
  const [state, setState] = useState("");
  const [roleType, setRoleType] = useState("");
  const [data, setData] = useState<WorkforceData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!state) return;
    setLoading(true);
    const params = new URLSearchParams({ state });
    if (roleType) params.set("role_type", roleType);

    const res = await fetch(`/api/radar/bls?${params.toString()}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  function densityColor(per1000: number) {
    if (per1000 > 18) return "bg-emerald-100 text-emerald-700";
    if (per1000 > 12) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  }

  function densityLabel(per1000: number) {
    if (per1000 > 18) return "High Density";
    if (per1000 > 12) return "Moderate";
    return "Low Density";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-sky-500" />
          Workforce Density
        </h2>
        <p className="text-muted mt-1">
          BLS data on healthcare workforce concentration by state.
          Low-density states need relocation incentives; high-density states have more talent to recruit.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">State *</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Role (optional)</label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Roles</option>
              {ROLE_TYPES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={!state || loading}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-4 animate-fade-in-up">
          {!data.available ? (
            <div className="bg-white rounded-2xl border border-border p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="text-muted mb-3">{data.message}</p>
              {data.bls_link && (
                <a
                  href={data.bls_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  View on BLS.gov <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : data.role && data.per_1000 ? (
            /* Single role view */
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{data.role} in {data.state}</h3>
                  <p className="text-sm text-muted">{data.soc_title} (SOC {data.soc_code})</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold">{data.total?.toLocaleString()}</div>
                  <div className="text-sm text-muted">Total Workers</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{data.per_1000}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${densityColor(data.per_1000)}`}>
                      {densityLabel(data.per_1000)}
                    </span>
                  </div>
                  <div className="text-sm text-muted">Per 1,000 Jobs</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold">${(data.avg_salary! / 1000).toFixed(0)}k</div>
                  <div className="text-sm text-muted">Avg Salary</div>
                </div>
              </div>
              <div className="bg-sky-50 rounded-xl p-4 text-sm text-sky-800">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                {data.interpretation}
              </div>
            </div>
          ) : (
            /* All roles view */
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold">Healthcare Workforce in {data.state}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50">
                      <th className="px-4 py-3 text-left font-medium">Role</th>
                      <th className="px-4 py-3 text-left font-medium">SOC Title</th>
                      <th className="px-4 py-3 text-right font-medium">Total Workers</th>
                      <th className="px-4 py-3 text-right font-medium">Per 1K Jobs</th>
                      <th className="px-4 py-3 text-right font-medium">Avg Salary</th>
                      <th className="px-4 py-3 text-left font-medium">Density</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.roles?.map((r) => (
                      <tr key={r.role} className="border-b border-border hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{r.role}</td>
                        <td className="px-4 py-3 text-muted text-xs">{r.soc_title}</td>
                        <td className="px-4 py-3 text-right font-mono">{r.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono">{r.per_1000}</td>
                        <td className="px-4 py-3 text-right font-mono">${(r.avg_salary / 1000).toFixed(0)}k</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${densityColor(r.per_1000)}`}>
                            {densityLabel(r.per_1000)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.bls_link && (
                <div className="px-6 py-3 border-t border-border">
                  <a
                    href={data.bls_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                  >
                    Full BLS data for {data.state} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {!data && !loading && (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-lg mb-2">Analyze Workforce</h3>
          <p className="text-muted max-w-md mx-auto">
            See how many RNs, CNAs, LPNs work in each state. Identify talent-rich
            areas to recruit from, and underserved areas that need relocation incentives.
          </p>
        </div>
      )}
    </div>
  );
}
