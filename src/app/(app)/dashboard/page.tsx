"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Radar, Users, Building2, MessageSquare, TrendingUp,
  ArrowRight, Bell, AlertTriangle, CheckCircle2,
  Clock, Flame, BarChart3, UserPlus, Briefcase, Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

const InteractiveChart = dynamic(() => import("@/components/InteractiveChart"), { ssr: false });

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
}

interface FollowUp {
  id: string; type: string; note: string; due_date: string;
  first_name: string; last_name: string; role_type: string;
  candidate_id: string; building_name: string;
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
      const p = activeBuilding ? `?building_id=${activeBuilding.id}` : "";
      const bp = activeBuilding ? `&building_id=${activeBuilding.id}` : "";
      const [sRes, fRes, oRes, uRes] = await Promise.all([
        fetch(`/api/stats${p}`), fetch(`/api/stats/funnel${p}`),
        fetch(`/api/follow-ups?overdue=true${bp}`), fetch(`/api/follow-ups?upcoming=true${bp}`),
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
    return <div className="flex items-center justify-center py-24"><Radar className="w-8 h-8 text-cyan-400 animate-spin" /></div>;
  }

  const hired = stats?.pipeline?.find((p) => p.status === "hired");

  // Build chart data
  const pipelineChartData = (stats?.pipeline || []).map((p) => ({
    name: p.status.replace("_", " "),
    value: parseInt(p.count),
  }));

  const roleChartData = (stats?.role_breakdown || []).map((r) => ({
    name: r.role_type,
    value: parseInt(r.count),
  }));

  const sourceChartData = (funnel?.sources || []).map((s) => ({
    name: s.source.replace("_", " "),
    value: parseInt(s.total),
    engaged: parseInt(s.engaged),
    hired: parseInt(s.hired),
  }));

  const activityChartData = (funnel?.daily_activity || []).map((d) => ({
    name: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: parseInt(d.candidates_added),
  }));

  const outreachTypeData = (funnel?.outreach_by_type || []).map((o) => ({
    name: o.type,
    value: parseInt(o.count),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {activeBuilding ? activeBuilding.name : "Command Center"}
          </h2>
          <p className="text-secondary text-sm mt-1">
            {activeBuilding ? `${activeBuilding.city}, ${activeBuilding.state}` : "All buildings overview"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/sweep" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 hover:from-amber-400 hover:to-orange-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
            <Zap className="w-4 h-4" /> Full Sweep
          </Link>
          <Link href="/radar" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition bg-gradient-to-r from-cyan-500 to-teal-400 text-gray-900 hover:from-cyan-400 hover:to-teal-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <Radar className="w-4 h-4" /> NPI Search
          </Link>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3 animate-slide-up"
          style={{ background: "rgba(251, 113, 133, 0.08)", border: "1px solid rgba(251, 113, 133, 0.2)" }}>
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-rose-300">{overdue.length} overdue follow-up{overdue.length > 1 ? "s" : ""}</span>
            <span className="text-rose-300/70 text-sm ml-2">
              {overdue.slice(0, 3).map((f) => `${f.first_name} ${f.last_name}`).join(", ")}
            </span>
          </div>
          <Link href="/candidates" className="text-sm text-rose-300 hover:text-rose-200 font-medium">View</Link>
        </div>
      )}

      {/* Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 stagger">
        {[
          { label: "Buildings", value: stats?.total_buildings || 0, icon: Building2, gradient: "from-cyan-500/10 to-cyan-500/5", accent: "text-cyan-400", href: "/buildings" },
          { label: "Candidates", value: stats?.total_candidates || 0, icon: Users, gradient: "from-teal-500/10 to-teal-500/5", accent: "text-teal-400", href: "/candidates" },
          { label: "Hired", value: hired?.count || 0, icon: CheckCircle2, gradient: "from-emerald-500/10 to-emerald-500/5", accent: "text-emerald-400", href: "/candidates?status=hired" },
          { label: "Outreach / 7d", value: stats?.outreach_this_week || 0, icon: MessageSquare, gradient: "from-violet-500/10 to-violet-500/5", accent: "text-violet-400", href: "/outreach" },
          { label: "Overdue", value: funnel?.overdue_followups || 0, icon: Bell, gradient: overdue.length > 0 ? "from-rose-500/10 to-rose-500/5" : "from-zinc-500/10 to-zinc-500/5", accent: overdue.length > 0 ? "text-rose-400" : "text-zinc-400", href: "/candidates" },
        ].map((card) => (
          <Link key={card.label} href={card.href}
            className="glass glass-hover rounded-2xl p-4 group animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.accent}`} />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="text-2xl font-bold metric animate-number-pop">{card.value}</div>
            <div className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Conversion Funnel */}
      {funnel && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold">Conversion Funnel</h3>
            {funnel.avg_time_to_hire_days && (
              <span className="ml-auto text-xs text-secondary flex items-center gap-1">
                <Clock className="w-3 h-3" /> Avg {funnel.avg_time_to_hire_days}d to hire
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: "Discovered → Contacted", pct: funnel.conversion.discovered_to_contacted, color: "text-cyan-400" },
              { label: "Contacted → Interested", pct: funnel.conversion.contacted_to_interested, color: "text-teal-400" },
              { label: "Interested → Hired", pct: funnel.conversion.interested_to_hired, color: "text-emerald-400" },
              { label: "Overall Hire Rate", pct: funnel.conversion.overall, color: "text-amber-400" },
            ].map((step) => (
              <div key={step.label} className="text-center">
                <div className={`text-3xl font-bold metric ${step.color}`}>{step.pct}%</div>
                <div className="text-[10px] text-muted mt-1 uppercase tracking-wider">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveChart
          title="Pipeline Distribution"
          subtitle="Candidates by stage"
          data={pipelineChartData}
          defaultType="bar"
          allowedTypes={["bar", "pie", "area"]}
          colors={["#22d3ee", "#2dd4bf", "#fbbf24", "#a78bfa", "#fb7185", "#34d399", "#f97316", "#818cf8", "#60a5fa", "#e879f9"]}
        />

        <InteractiveChart
          title="Candidates by Role"
          subtitle="Role type breakdown"
          data={roleChartData}
          defaultType="pie"
          allowedTypes={["pie", "bar"]}
        />

        <InteractiveChart
          title="Source Effectiveness"
          subtitle="Where candidates come from"
          data={sourceChartData}
          dataKeys={["value", "engaged", "hired"]}
          defaultType="bar"
          allowedTypes={["bar", "line"]}
          showLegend
          colors={["#22d3ee", "#2dd4bf", "#34d399"]}
        />

        <InteractiveChart
          title="Daily Activity"
          subtitle="Candidates added per day (last 14 days)"
          data={activityChartData}
          defaultType="area"
          allowedTypes={["area", "line", "bar"]}
          colors={["#a78bfa"]}
        />

        {outreachTypeData.length > 0 && (
          <InteractiveChart
            title="Outreach by Channel"
            subtitle="Communication breakdown"
            data={outreachTypeData}
            defaultType="pie"
            allowedTypes={["pie", "bar"]}
            colors={["#60a5fa", "#34d399", "#fbbf24", "#818cf8", "#fb7185"]}
          />
        )}
      </div>

      {/* Follow-ups */}
      {(upcoming.length > 0 || overdue.length > 0) && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" /> Follow-ups
          </h3>
          <div className="space-y-2">
            {[...overdue, ...upcoming].slice(0, 8).map((f) => {
              const isOverdue = new Date(f.due_date) < new Date();
              return (
                <Link key={f.id} href={`/candidates/${f.candidate_id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition ${isOverdue ? "bg-rose-500/5 hover:bg-rose-500/10" : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOverdue ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{f.first_name} {f.last_name}</div>
                    <div className="text-[11px] text-muted capitalize">{f.type.replace("_", " ")} — {f.role_type}</div>
                  </div>
                  <div className={`text-xs shrink-0 ${isOverdue ? "text-rose-400 font-semibold" : "text-muted"}`}>
                    {isOverdue ? "OVERDUE" : new Date(f.due_date).toLocaleDateString()}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/sweep", icon: Zap, label: "Full Sweep", desc: "One-click scan", color: "bg-amber-500/10 hover:bg-amber-500/15 text-amber-400" },
            { href: "/pipeline", icon: Briefcase, label: "Pipeline", desc: "Kanban board", color: "bg-teal-500/10 hover:bg-teal-500/15 text-teal-400" },
            { href: "/intelligence", icon: BarChart3, label: "CMS Intel", desc: "Competitor data", color: "bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-400" },
            { href: "/military", icon: Flame, label: "Military", desc: "Transitioning medics", color: "bg-violet-500/10 hover:bg-violet-500/15 text-violet-400" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`flex items-center gap-3 p-4 rounded-xl transition ${a.color}`}>
              <a.icon className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-medium text-sm text-foreground">{a.label}</div>
                <div className="text-[11px] text-muted">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
