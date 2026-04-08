"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radar, Users, Building2, MessageSquare, TrendingUp,
  UserPlus, ArrowRight, Activity,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { STATUS_COLORS } from "@/lib/types";

interface Stats {
  total_buildings: number;
  total_candidates: number;
  pipeline: Array<{ status: string; count: string }>;
  outreach_this_week: number;
  role_breakdown: Array<{ role_type: string; count: string }>;
}

export default function DashboardPage() {
  const { activeBuilding } = useAppStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = activeBuilding ? `?building_id=${activeBuilding.id}` : "";
      const res = await fetch(`/api/stats${params}`);
      if (res.ok) setStats(await res.json());
      setLoading(false);
    }
    load();
  }, [activeBuilding]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Radar className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Buildings", value: stats?.total_buildings || 0, icon: Building2, color: "bg-sky-50 text-sky-600", href: "/buildings" },
    { label: "Candidates", value: stats?.total_candidates || 0, icon: Users, color: "bg-emerald-50 text-emerald-600", href: "/candidates" },
    { label: "Outreach This Week", value: stats?.outreach_this_week || 0, icon: MessageSquare, color: "bg-amber-50 text-amber-600", href: "/outreach" },
    {
      label: "Hired",
      value: stats?.pipeline?.find((p) => p.status === "hired")?.count || 0,
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
      href: "/candidates?status=hired",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {activeBuilding ? activeBuilding.name : "Command Center"}
          </h2>
          <p className="text-muted mt-1">
            {activeBuilding
              ? `${activeBuilding.city}, ${activeBuilding.state} — ${activeBuilding.type}`
              : "All buildings talent overview"}
          </p>
        </div>
        <Link
          href="/radar"
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition"
        >
          <Radar className="w-4 h-4" />
          Scan for Talent
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
            </div>
            <div className="text-3xl font-bold animate-count-up">{card.value}</div>
            <div className="text-sm text-muted mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-sky-500" />
            <h3 className="font-semibold text-lg">Pipeline</h3>
          </div>
          {stats?.pipeline && stats.pipeline.length > 0 ? (
            <div className="space-y-3">
              {stats.pipeline.map((p) => {
                const total = stats.total_candidates || 1;
                const count = parseInt(p.count);
                const pct = Math.round((count / total) * 100);
                const colorClass = STATUS_COLORS[p.status as keyof typeof STATUS_COLORS] || "bg-zinc-100 text-zinc-700";
                return (
                  <div key={p.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colorClass}`}>
                        {p.status.replace("_", " ")}
                      </span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No candidates yet</p>
              <Link href="/radar" className="text-primary text-sm hover:underline">
                Start scanning for talent
              </Link>
            </div>
          )}
        </div>

        {/* Role Breakdown */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-sky-500" />
            <h3 className="font-semibold text-lg">By Role</h3>
          </div>
          {stats?.role_breakdown && stats.role_breakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.role_breakdown.map((r) => {
                const total = stats.total_candidates || 1;
                const count = parseInt(r.count);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={r.role_type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{r.role_type}</span>
                      <span className="text-sm text-muted">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No role data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/radar"
            className="flex items-center gap-3 p-4 rounded-xl bg-sky-50 hover:bg-sky-100 transition"
          >
            <Radar className="w-5 h-5 text-sky-600" />
            <div>
              <div className="font-medium text-sm">NPI Search</div>
              <div className="text-xs text-muted">Find licensed providers</div>
            </div>
          </Link>
          <Link
            href="/intelligence"
            className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition"
          >
            <Building2 className="w-5 h-5 text-amber-600" />
            <div>
              <div className="font-medium text-sm">CMS Intel</div>
              <div className="text-xs text-muted">Scan competitor staffing</div>
            </div>
          </Link>
          <Link
            href="/buildings"
            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition"
          >
            <Building2 className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-medium text-sm">Add Building</div>
              <div className="text-xs text-muted">Register a new facility</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
