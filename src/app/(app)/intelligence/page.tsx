"use client";

import { useState } from "react";
import {
  BarChart3, Search, Building2, Star, Users, AlertTriangle,
  Loader2, TrendingDown, MapPin, Phone, Shield,
} from "lucide-react";
import { US_STATES } from "@/lib/types";
import { toast } from "sonner";

interface Facility {
  cms_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  overall_rating: number | null;
  staffing_rating: number | null;
  rn_staffing_hours: number | null;
  total_beds: number | null;
  occupancy_rate: number | null;
  ownership_type: string;
  total_penalties_count: string;
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted">N/A</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default function IntelligencePage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ state: "", city: "", zip: "" });

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!filters.state) {
      toast.error("State is required");
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    const res = await fetch(`/api/radar/cms?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setFacilities(data.facilities || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }

  const understaffed = facilities.filter((f) => f.staffing_rating !== null && f.staffing_rating <= 2);
  const lowRated = facilities.filter((f) => f.overall_rating !== null && f.overall_rating <= 2);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-sky-500" />
          Market Intelligence
        </h2>
        <p className="text-muted mt-1">
          CMS data on competing facilities — identify understaffed buildings whose talent may be looking to move
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-border p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">State *</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP</label>
            <input
              value={filters.zip}
              onChange={(e) => setFilters({ ...filters, zip: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Optional"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Scan Area
            </button>
          </div>
        </div>
      </form>

      {/* Summary Cards */}
      {facilities.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-sky-500" />
                <span className="font-semibold">Facilities Found</span>
              </div>
              <div className="text-3xl font-bold">{total}</div>
            </div>
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <span className="font-semibold">Understaffed</span>
              </div>
              <div className="text-3xl font-bold text-red-600">{understaffed.length}</div>
              <p className="text-xs text-muted mt-1">Staffing rating 1-2 stars — recruit their burned-out staff</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Low Rated</span>
              </div>
              <div className="text-3xl font-bold text-amber-600">{lowRated.length}</div>
              <p className="text-xs text-muted mt-1">Overall 1-2 stars — staff likely unhappy</p>
            </div>
          </div>

          {/* Facility Table */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold">
                Competing Facilities
                <span className="text-sm font-normal text-muted ml-2">sorted by staffing rating (worst first)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium">Facility</th>
                    <th className="px-4 py-3 text-left font-medium">Overall</th>
                    <th className="px-4 py-3 text-left font-medium">Staffing</th>
                    <th className="px-4 py-3 text-left font-medium">Beds</th>
                    <th className="px-4 py-3 text-left font-medium">Occupancy</th>
                    <th className="px-4 py-3 text-left font-medium">Penalties</th>
                    <th className="px-4 py-3 text-left font-medium">Ownership</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((f, i) => (
                    <tr
                      key={f.cms_id || i}
                      className={`border-b border-border hover:bg-slate-50 ${
                        f.staffing_rating !== null && f.staffing_rating <= 2 ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{f.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <MapPin className="w-3 h-3" />
                          {f.city}, {f.state} {f.zip}
                        </div>
                        {f.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Phone className="w-3 h-3" />
                            {f.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <RatingStars rating={f.overall_rating} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <RatingStars rating={f.staffing_rating} />
                          {f.staffing_rating !== null && f.staffing_rating <= 2 && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{f.total_beds || "—"}</td>
                      <td className="px-4 py-3">
                        {f.occupancy_rate ? `${Math.round(f.occupancy_rate)}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={parseInt(f.total_penalties_count) > 0 ? "text-red-600 font-medium" : ""}>
                          {f.total_penalties_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{f.ownership_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty */}
      {!loading && facilities.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-lg mb-2">Competitor Intelligence</h3>
          <p className="text-muted max-w-lg mx-auto">
            Search CMS data to find nursing homes in your area. Facilities with low staffing ratings
            are your best recruiting targets — their staff are likely overworked and open to new opportunities.
          </p>
        </div>
      )}
    </div>
  );
}
