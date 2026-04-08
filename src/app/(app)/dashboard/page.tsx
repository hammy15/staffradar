"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radar, Users, Building2, MessageSquare, TrendingUp,
  ArrowRight, Activity, Bell, AlertTriangle, CheckCircle2,
  Clock, Flame, BarChart3, UserPlus, Briefcase,
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

interface Funnel {
  funnel: Array<{ status: string; count: string }>;
  sources: Array<{ source: string; total: string; engaged: string; hired: string }>;
  avg_time_to_hire_days: number | null;
  daily_activity: Array<{ day: string; candidates_added: string }>;
  outreach_by_type: Array<{ type: string; count: string }>;
  overdue_followups: number;
  conversion: { discovered_to_contacted: number; contacted_to_interested: number; interested_to_hired: number; overall: number };
  period_days: number;
}

interface FollowUp {
  id: string;
  type: string;
  note: string;
  due_date: string;
  first_name: string;
  last_name: string;
  role_type: string;
  candidate_id: string;
  candidate_status: string;
  building_name: string;
}

export default function DashboardPage() {
  const { activeBuilding } = useAppStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [overdue, setOverdue] = useState<FollowUp[]>([]);
  const [upcoming, setUpcoming] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = activeBuilding ? `?building_id=${activeBuilding.id}` : "";
      const bParam = activeBuilding ? `&building_id=${activeBuilding.id}` : "";

      const [sRes, fRes, oRes, uRes] = await Promise.all([
        fetch(`/api/stats${params}`),
        fetch(`/api/stats/funnel${params}`),
        fetch(`/api/follow-ups?overdue=true${bParam}`),
        fetch(`/api/follow-ups?upcoming=true${bParam}`),
      ]);

      if (sRes.ok) setStats(await sRes.json());
      if (fRes.ok) setFunnel(await fRes.json());
      if (oRes.ok) setOverdue(await oRes.json());
      if (uRes.ok) setUpcoming(await uRes.json());
      setLoading(false);
    }
    load();
  }, [activeBuilding]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Radar className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  const hired = stats?.pipeline?.find((p) => p.status === "hired");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{activeBuilding ? activeBuilding.name : "Command Center"}</h2>
          <p className="text-muted mt-1">{activeBuilding ? `${activeBuilding.city}, ${activeBuilding.state}` : "All buildings overview"}</p>
        </div>
        <Link href="/radar" className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition">
          <Radar className="w-4 h-4" /> Scan for Talent
        </Link>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-red-800">{overdue.length} overdue follow-up{overdue.length > 1 ? "s" : ""}</span>
            <span className="text-red-700 text-sm ml-2">
              {overdue.slice(0, 3).map((f) => `${f.first_name} ${f.last_name}`).join(", ")}
              {overdue.length > 3 && ` +${overdue.length - 3} more`}
            </span>
          </div>
          <Link href="/candidates" className="text-sm text-red-700 hover:underline font-medium">View all</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        {[
          { label: "Buildings", value: stats?.total_buildings || 0, icon: Building2, color: "bg-sky-50 text-sky-600", href: "/buildings" },
          { label: "Candidates", value: stats?.total_candidates || 0, icon: Users, color: "bg-emerald-50 text-emerald-600", href: "/candidates" },
          { label: "Hired", value: hired?.count || 0, icon: CheckCircle2, color: "bg-green-50 text-green-600", href: "/candidates?status=hired" },
          { label: "Outreach / 7d", value: stats?.outreach_this_week || 0, icon: MessageSquare, color: "bg-amber-50 text-amber-600", href: "/outreach" },
          { label: "Overdue", value: funnel?.overdue_followups || 0, icon: Bell, color: overdue.length > 0 ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-600", href: "/candidates" },
        ].map((card) => (
          <Link key={card.label} href={card.href} className="bg-white rounded-2xl border border-border p-4 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-muted mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Conversion Funnel + Time to Hire */}
      {funnel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" /> Conversion Funnel (last {funnel.period_days} days)
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Discovered → Contacted", pct: funnel.conversion.discovered_to_contacted },
                { label: "Contacted → Interested", pct: funnel.conversion.contacted_to_interested },
                { label: "Interested → Hired", pct: funnel.conversion.interested_to_hired },
                { label: "Overall Hire Rate", pct: funnel.conversion.overall },
              ].map((step) => (
                <div key={step.label} className="text-center">
                  <div className={`text-3xl font-bold ${step.pct > 30 ? "text-emerald-600" : step.pct > 10 ? "text-amber-600" : "text-red-600"}`}>
                    {step.pct}%
                  </div>
                  <div className="text-xs text-muted mt-1">{step.label}</div>
                </div>
              ))}
            </div>
            {funnel.avg_time_to_hire_days && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted" />
                <span className="text-sm">Average time to hire: <strong>{funnel.avg_time_to_hire_days} days</strong></span>
              </div>
            )}
          </div>

          {/* Source Effectiveness */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-500" /> Source Effectiveness
            </h3>
            {funnel.sources.length > 0 ? (
              <div className="space-y-3">
                {funnel.sources.map((s) => {
                  const total = parseInt(s.total);
                  const engaged = parseInt(s.engaged);
                  const rate = total > 0 ? Math.round((engaged / total) * 100) : 0;
                  return (
                    <div key={s.source}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize">{s.source.replace("_", " ")}</span>
                        <span className="text-muted">{total} total, {rate}% engaged</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">No source data yet</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-500" /> Pipeline
            </h3>
            <Link href="/pipeline" className="text-xs text-primary hover:underline">Board view →</Link>
          </div>
          {stats?.pipeline && stats.pipeline.length > 0 ? (
            <div className="space-y-2.5">
              {stats.pipeline.map((p) => {
                const total = stats.total_candidates || 1;
                const count = parseInt(p.count);
                const pct = Math.round((count / total) * 100);
                const colorClass = STATUS_COLORS[p.status as keyof typeof STATUS_COLORS] || "bg-zinc-100 text-zinc-700";
                return (
                  <div key={p.status} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize w-28 text-center ${colorClass}`}>
                      {p.status.replace("_", " ")}
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted">
              <UserPlus className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <Link href="/radar" className="text-primary text-sm hover:underline">Start scanning</Link>
            </div>
          )}
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" /> Upcoming Follow-ups
          </h3>
          {upcoming.length === 0 && overdue.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">No scheduled follow-ups</p>
          ) : (
            <div className="space-y-2">
              {[...overdue, ...upcoming].slice(0, 8).map((f) => {
                const isOverdue = new Date(f.due_date) < new Date();
                return (
                  <Link key={f.id} href={`/candidates/${f.candidate_id}`}
                    className={`flex items-center gap-3 p-3 rounded-xl hover:shadow-sm transition ${isOverdue ? "bg-red-50" : "bg-slate-50"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOverdue ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                      {isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{f.first_name} {f.last_name}</div>
                      <div className="text-xs text-muted capitalize">{f.type.replace("_", " ")} — {f.role_type}</div>
                    </div>
                    <div className={`text-xs shrink-0 ${isOverdue ? "text-red-600 font-medium" : "text-muted"}`}>
                      {isOverdue ? "OVERDUE" : new Date(f.due_date).toLocaleDateString()}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/radar", icon: Radar, label: "NPI Search", desc: "Find providers", color: "bg-sky-50 hover:bg-sky-100" },
            { href: "/pipeline", icon: Briefcase, label: "Pipeline Board", desc: "Kanban view", color: "bg-emerald-50 hover:bg-emerald-100" },
            { href: "/intelligence", icon: BarChart3, label: "CMS Intel", desc: "Competitor data", color: "bg-amber-50 hover:bg-amber-100" },
            { href: "/military", icon: Flame, label: "Military", desc: "Transitioning medics", color: "bg-purple-50 hover:bg-purple-100" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`flex items-center gap-3 p-4 rounded-xl ${a.color} transition`}>
              <a.icon className="w-5 h-5 text-inherit shrink-0" />
              <div><div className="font-medium text-sm">{a.label}</div><div className="text-xs text-muted">{a.desc}</div></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
