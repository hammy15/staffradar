"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2, MapPin, Star, AlertTriangle, Users, TrendingUp,
  DollarSign, Activity, Loader2, Search,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Building } from "@/lib/types";

const InteractiveChart = dynamic(() => import("@/components/InteractiveChart"), { ssr: false });

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted">N/R</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3 h-3 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "urgent") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-semibold uppercase tracking-wider">Urgent</span>;
  if (status === "watch") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold uppercase tracking-wider">Watch</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase tracking-wider">On Track</span>;
}

export default function BuildingsPage() {
  const { buildings, setBuildings } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/buildings").then((r) => r.json()).then((b) => { setBuildings(b); setLoading(false); });
  }, [setBuildings]);

  const states = [...new Set(buildings.map((b) => b.state))].sort();
  const types = [...new Set(buildings.map((b) => b.type))].sort();

  const filtered = buildings.filter((b) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.city.toLowerCase().includes(search.toLowerCase())) return false;
    if (stateFilter && b.state !== stateFilter) return false;
    if (typeFilter && b.type !== typeFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });

  const snfBuildings = filtered.filter((b) => b.type === "SNF");
  const totalBeds = filtered.reduce((s, b) => s + (b.beds || 0), 0);
  const avgOcc = snfBuildings.filter((b) => b.occupancy_pct).length > 0
    ? Math.round(snfBuildings.filter((b) => b.occupancy_pct).reduce((s, b) => s + (b.occupancy_pct || 0), 0) / snfBuildings.filter((b) => b.occupancy_pct).length)
    : 0;
  const avgRating = snfBuildings.filter((b) => b.overall_rating).length > 0
    ? (snfBuildings.filter((b) => b.overall_rating).reduce((s, b) => s + (b.overall_rating || 0), 0) / snfBuildings.filter((b) => b.overall_rating).length).toFixed(1)
    : "—";
  const urgentCount = filtered.filter((b) => b.status === "urgent").length;
  const totalRevenue = filtered.reduce((s, b) => s + (b.revenue_2023 || 0), 0);

  // Chart data
  const stateChartData = states.map((s) => ({
    name: s,
    value: buildings.filter((b) => b.state === s).length,
  }));

  const ratingChartData = [
    { name: "5★", value: snfBuildings.filter((b) => b.overall_rating === 5).length },
    { name: "4★", value: snfBuildings.filter((b) => b.overall_rating === 4).length },
    { name: "3★", value: snfBuildings.filter((b) => b.overall_rating === 3).length },
    { name: "2★", value: snfBuildings.filter((b) => b.overall_rating === 2).length },
    { name: "1★", value: snfBuildings.filter((b) => b.overall_rating === 1).length },
  ].filter((d) => d.value > 0);

  const occChartData = snfBuildings
    .filter((b) => b.occupancy_pct)
    .sort((a, b) => (b.occupancy_pct || 0) - (a.occupancy_pct || 0))
    .slice(0, 15)
    .map((b) => ({ name: b.name.length > 12 ? b.name.slice(0, 12) + "…" : b.name, value: b.occupancy_pct || 0 }));

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cascadia Healthcare</h2>
        <p className="text-secondary text-sm mt-1">{buildings.length} facilities across {states.length} states</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Facilities", value: filtered.length, icon: Building2, accent: "text-cyan-400" },
          { label: "Total Beds", value: totalBeds.toLocaleString(), icon: Users, accent: "text-teal-400" },
          { label: "Avg Occ", value: `${avgOcc}%`, icon: Activity, accent: "text-violet-400" },
          { label: "Avg Rating", value: avgRating, icon: Star, accent: "text-amber-400" },
          { label: "Urgent", value: urgentCount, icon: AlertTriangle, accent: urgentCount > 0 ? "text-rose-400" : "text-zinc-500" },
          { label: "Revenue", value: `$${(totalRevenue / 1000000).toFixed(0)}M`, icon: DollarSign, accent: "text-emerald-400" },
        ].map((m) => (
          <div key={m.label} className="glass rounded-xl p-3">
            <m.icon className={`w-4 h-4 ${m.accent} mb-1.5`} />
            <div className="text-xl font-bold metric">{m.value}</div>
            <div className="text-[10px] text-muted uppercase tracking-wider">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InteractiveChart title="By State" data={stateChartData} defaultType="pie" allowedTypes={["pie", "bar"]} height={220}
          colors={["#22d3ee", "#2dd4bf", "#a78bfa", "#fbbf24", "#fb7185"]} />
        <InteractiveChart title="Rating Distribution" subtitle="SNF facilities only" data={ratingChartData} defaultType="bar" allowedTypes={["bar", "pie"]} height={220}
          colors={["#34d399", "#2dd4bf", "#fbbf24", "#f97316", "#fb7185"]} />
        <InteractiveChart title="Top Occupancy" subtitle="SNF by occupancy %" data={occChartData} defaultType="bar" allowedTypes={["bar", "line"]} height={220}
          valueFormatter={(v) => `${v}%`} colors={["#a78bfa"]} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buildings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm" />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm">
          <option value="">All States</option>
          {states.map((s) => <option key={s} value={s}>{s} ({buildings.filter((b) => b.state === s).length})</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm">
          <option value="">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm">
          <option value="">All Status</option>
          <option value="urgent">Urgent</option>
          <option value="watch">Watch</option>
          <option value="on_track">On Track</option>
        </select>
      </div>

      {/* Facility Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Facility</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-right">Beds</th>
                <th className="px-4 py-3 text-right">Occ %</th>
                <th className="px-4 py-3 text-right">RN hrs/d</th>
                <th className="px-4 py-3 text-right">Turnover</th>
                <th className="px-4 py-3 text-right">EBITDAR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b: Building) => (
                <tr key={b.id} className={b.special_focus ? "bg-rose-500/5" : ""}>
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      {b.name}
                      {b.special_focus && <span title="Special Focus Facility"><AlertTriangle className="w-3 h-3 text-rose-400" /></span>}
                    </div>
                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {b.city}, {b.state}
                      {b.ccn && <span className="ml-1 text-muted">· CCN {b.ccn}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      b.type === "SNF" ? "bg-cyan-500/15 text-cyan-400" :
                      b.type === "ALF" ? "bg-violet-500/15 text-violet-400" :
                      "bg-teal-500/15 text-teal-400"
                    }`}>{b.type}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-center"><Stars rating={b.overall_rating} /></td>
                  <td className="px-4 py-3 text-right font-mono">{b.beds || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {b.occupancy_pct ? (
                      <span className={`font-mono ${b.occupancy_pct >= 85 ? "text-emerald-400" : b.occupancy_pct >= 70 ? "text-amber-400" : "text-rose-400"}`}>
                        {b.occupancy_pct}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.rn_hours_per_day ? (
                      <span className={`font-mono ${b.rn_hours_per_day >= 1.0 ? "text-emerald-400" : b.rn_hours_per_day >= 0.6 ? "text-amber-400" : "text-rose-400"}`}>
                        {b.rn_hours_per_day.toFixed(3)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.turnover_pct ? (
                      <span className={`font-mono ${b.turnover_pct <= 40 ? "text-emerald-400" : b.turnover_pct <= 55 ? "text-amber-400" : "text-rose-400"}`}>
                        {b.turnover_pct}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.ebitdar_annual ? (
                      <span className="font-mono">${(b.ebitdar_annual / 1000000).toFixed(1)}M</span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
