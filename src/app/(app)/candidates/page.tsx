"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Search, Filter, ChevronDown, ChevronUp, MapPin, Phone,
  Mail, Award, Loader2, UserPlus, ExternalLink, Zap, Flame,
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
  const { activeBuilding } = useAppStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeBuilding) params.set("building_id", activeBuilding.id);
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (roleFilter) params.set("role_type", roleFilter);

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
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      toast.success(`Status updated to ${status}`);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Candidate Pipeline</h2>
          <p className="text-muted mt-1">{total} candidates total</p>
        </div>
        <button
          onClick={async () => {
            const res = await fetch("/api/radar/score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ building_id: activeBuilding?.id }),
            });
            if (res.ok) {
              const d = await res.json();
              toast.success(`Scored ${d.updated} candidates`);
              load();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition text-sm"
        >
          <Zap className="w-4 h-4" />
          Auto-Score All
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search by name or NPI..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Roles</option>
          {ROLE_TYPES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
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
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Score</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Building</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setSelectedCandidate(selectedCandidate?.id === c.id ? null : c)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {c.first_name} {c.last_name}
                        {c.credentials && <span className="text-muted ml-1 text-xs">{c.credentials}</span>}
                      </div>
                      {c.npi && <div className="text-xs text-muted font-mono">NPI: {c.npi}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                        {c.role_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus(c.id, e.target.value as CandidateStatus);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[c.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.city}, {c.state}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.phone && (
                          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="text-muted hover:text-primary">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="text-muted hover:text-primary">
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={c.score} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">{c.source.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{(c as unknown as Record<string, string>).building_name || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Detail Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-border shadow-2xl z-50 overflow-y-auto animate-fade-in-up">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Candidate Detail</h3>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-muted hover:text-foreground"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-2xl font-bold">
                  {selectedCandidate.first_name} {selectedCandidate.last_name}
                </h4>
                {selectedCandidate.credentials && (
                  <p className="text-muted">{selectedCandidate.credentials}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                    {selectedCandidate.role_type}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedCandidate.status]}`}>
                    {selectedCandidate.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedCandidate.npi && (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-muted" />
                    <span className="font-mono">NPI: {selectedCandidate.npi}</span>
                  </div>
                )}
                {selectedCandidate.phone && (
                  <a href={`tel:${selectedCandidate.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Phone className="w-4 h-4 text-muted" />
                    {selectedCandidate.phone}
                  </a>
                )}
                {selectedCandidate.email && (
                  <a href={`mailto:${selectedCandidate.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Mail className="w-4 h-4 text-muted" />
                    {selectedCandidate.email}
                  </a>
                )}
                {selectedCandidate.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted" />
                    {selectedCandidate.address && `${selectedCandidate.address}, `}
                    {selectedCandidate.city}, {selectedCandidate.state} {selectedCandidate.zip}
                  </div>
                )}
              </div>

              {selectedCandidate.specialty && (
                <div>
                  <h5 className="text-sm font-medium mb-1">Specialty</h5>
                  <p className="text-sm text-muted">{selectedCandidate.specialty}</p>
                </div>
              )}

              {selectedCandidate.current_employer && (
                <div>
                  <h5 className="text-sm font-medium mb-1">Current Employer</h5>
                  <p className="text-sm text-muted">{selectedCandidate.current_employer}</p>
                </div>
              )}

              {selectedCandidate.notes && (
                <div>
                  <h5 className="text-sm font-medium mb-1">Notes</h5>
                  <p className="text-sm text-muted">{selectedCandidate.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-border">
                <select
                  value={selectedCandidate.status}
                  onChange={(e) => {
                    updateStatus(selectedCandidate.id, e.target.value as CandidateStatus);
                    setSelectedCandidate({ ...selectedCandidate, status: e.target.value as CandidateStatus });
                  }}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
