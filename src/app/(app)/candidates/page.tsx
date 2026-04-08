"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, MapPin, Phone, Mail, Loader2, UserPlus, Zap, Flame,
  Download, CheckSquare, Square, ArrowUpDown,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { ROLE_TYPES, STATUS_COLORS } from "@/lib/types";

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1"><Flame className="w-3 h-3" />Hot</span>;
  if (score >= 50) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Strong</span>;
  if (score >= 30) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Warm</span>;
  if (score > 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Cool</span>;
  return <span className="text-xs text-muted">—</span>;
}

const STATUSES: CandidateStatus[] = [
  "discovered", "researched", "contacted", "responded", "interested",
  "interviewing", "offered", "hired", "declined", "not_interested",
];

export default function CandidatesPage() {
  const router = useRouter();
  const { activeBuilding } = useAppStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeBuilding) params.set("building_id", activeBuilding.id);
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (roleFilter) params.set("role_type", roleFilter);
    params.set("limit", "200");

    const res = await fetch(`/api/candidates?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setCandidates(data.candidates);
      setTotal(data.total);
    }
    setLoading(false);
  }, [activeBuilding, search, statusFilter, roleFilter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: CandidateStatus) {
    const updates: Record<string, unknown> = { status };
    if (status === "hired") updates.hired_at = new Date().toISOString();
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      toast.success(`Status updated`);
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === candidates.length) setSelected(new Set());
    else setSelected(new Set(candidates.map((c) => c.id)));
  }

  async function handleBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    const res = await fetch("/api/candidates/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Updated ${data.updated} candidates`);
      setSelected(new Set());
      setBulkStatus("");
      load();
    }
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (activeBuilding) params.set("building_id", activeBuilding.id);
    if (statusFilter) params.set("status", statusFilter);
    window.open(`/api/candidates/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Candidates</h2>
          <p className="text-muted mt-1">{total} total — click any row for full detail</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-border hover:bg-slate-50 font-medium rounded-xl text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={async () => {
            const res = await fetch("/api/radar/score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ building_id: activeBuilding?.id }),
            });
            if (res.ok) { const d = await res.json(); toast.success(`Scored ${d.updated} candidates`); load(); }
          }}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl text-sm">
            <Zap className="w-4 h-4" /> Auto-Score
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search by name or NPI..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-white">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-white">
          <option value="">All Roles</option>
          {ROLE_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-sky-50 rounded-xl px-4 py-3 animate-fade-in-up">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm">
            <option value="">Change status to...</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <button onClick={handleBulkStatus} disabled={!bulkStatus}
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg text-sm disabled:opacity-50">
            Apply
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-muted hover:text-foreground ml-auto">
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <UserPlus className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-lg mb-1">No candidates found</h3>
          <p className="text-muted">Use Talent Radar to discover and import candidates</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="px-3 py-3 text-left w-10">
                    <button onClick={selectAll}>
                      {selected.size === candidates.length ? <CheckSquare className="w-4 h-4 text-sky-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left font-medium">Name</th>
                  <th className="px-3 py-3 text-left font-medium">Role</th>
                  <th className="px-3 py-3 text-left font-medium">Status</th>
                  <th className="px-3 py-3 text-left font-medium">Score</th>
                  <th className="px-3 py-3 text-left font-medium">Location</th>
                  <th className="px-3 py-3 text-left font-medium">Contact</th>
                  <th className="px-3 py-3 text-left font-medium">Building</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id}
                    className={`border-b border-border hover:bg-slate-50 transition cursor-pointer ${selected.has(c.id) ? "bg-sky-50" : ""}`}
                    onClick={() => router.push(`/candidates/${c.id}`)}
                  >
                    <td className="px-3 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(c.id); }}>
                      {selected.has(c.id) ? <CheckSquare className="w-4 h-4 text-sky-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{c.first_name} {c.last_name}
                        {c.credentials && <span className="text-muted ml-1 text-xs">{c.credentials}</span>}
                      </div>
                      {c.npi && <div className="text-xs text-muted font-mono">NPI: {c.npi}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">{c.role_type}</span>
                    </td>
                    <td className="px-3 py-3">
                      <select value={c.status}
                        onChange={(e) => { e.stopPropagation(); updateStatus(c.id, e.target.value as CandidateStatus); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[c.status]}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3"><ScoreBadge score={c.score} /></td>
                    <td className="px-3 py-3 text-muted">
                      {c.city && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}, {c.state}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {c.phone && <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="text-muted hover:text-primary"><Phone className="w-3.5 h-3.5" /></a>}
                        {c.email && <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="text-muted hover:text-primary"><Mail className="w-3.5 h-3.5" /></a>}
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className="text-xs">{(c as unknown as Record<string, string>).building_name || "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
