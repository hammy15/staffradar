"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Radar, Loader2, CheckCircle2, Flame, TrendingUp, Users,
  ArrowRight, Building2, Zap, AlertCircle, MapPin, Phone,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { Building } from "@/lib/types";

interface SweepResult {
  building: { name: string; city: string; state: string; type: string };
  sweep_results: Record<string, { found: number; imported: number; skipped: number; error?: string }>;
  summary: {
    total_found: number;
    total_imported: number;
    total_skipped: number;
    hot_leads: number;
    strong_prospects: number;
  };
  top_candidates: Array<{
    id: string;
    name: string;
    role: string;
    score: number;
    city: string;
    state: string;
    phone: string;
    npi: string;
  }>;
}

const DEFAULT_ROLES = ["RN", "CNA", "LPN", "Med Tech"];

export default function SweepPage() {
  const { buildings } = useAppStore();
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<SweepResult | null>(null);

  function toggleRole(role: string) {
    setRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  }

  async function runSweep() {
    if (!selectedBuilding) { toast.error("Select a building first"); return; }
    if (roles.length === 0) { toast.error("Select at least one role"); return; }

    setRunning(true);
    setResult(null);
    setProgress("Initializing radar sweep...");

    // Simulate progress messages
    const progressMessages = [
      "Scanning NPI Registry...",
      `Searching for ${roles.join(", ")}...`,
      "Cross-referencing license data...",
      "Running 10-dimension scoring algorithm...",
      "Identifying hot leads...",
      "Generating intelligence report...",
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      if (msgIdx < progressMessages.length) {
        setProgress(progressMessages[msgIdx]);
        msgIdx++;
      }
    }, 2000);

    try {
      const res = await fetch("/api/radar/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ building_id: selectedBuilding, roles }),
      });

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setProgress("");
        toast.success(`Sweep complete — ${data.summary.total_imported} new candidates imported`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Sweep failed");
        setProgress("");
      }
    } catch {
      clearInterval(interval);
      toast.error("Sweep failed — network error");
      setProgress("");
    }
    setRunning(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          Full Radar Sweep
        </h2>
        <p className="text-muted mt-1">
          One click. Scans NPI for all priority roles near your building, imports candidates,
          runs 10-dimension scoring, and identifies your hottest leads.
        </p>
      </div>

      {/* Config */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">Configure Sweep</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Building</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a building...</option>
              {buildings.map((b: Building) => (
                <option key={b.id} value={b.id}>{b.name} — {b.city}, {b.state} ({b.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Roles to Scan</label>
            <div className="flex flex-wrap gap-2">
              {["RN", "CNA", "LPN", "Med Tech", "Physical Therapist", "Occupational Therapist", "Speech Therapist", "Social Worker"].map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    roles.includes(role)
                      ? "bg-sky-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={runSweep}
            disabled={running || !selectedBuilding || roles.length === 0}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold rounded-2xl transition disabled:opacity-50 text-lg"
          >
            {running ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                Running Sweep...
              </>
            ) : (
              <>
                <Radar className="w-6 h-6" />
                Launch Full Sweep
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
      {running && progress && (
        <div className="bg-sky-50 rounded-2xl border border-sky-200 p-6 text-center animate-fade-in-up">
          <Radar className="w-10 h-10 text-sky-500 mx-auto mb-3 animate-spin" />
          <p className="font-medium text-sky-800">{progress}</p>
          <p className="text-sm text-sky-600 mt-1">This may take 30-60 seconds depending on the number of roles...</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Summary */}
          <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-1">Sweep Complete: {result.building.name}</h3>
            <p className="text-white/80 text-sm mb-4">{result.building.city}, {result.building.state} — {result.building.type}</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: "Found", value: result.summary.total_found, icon: Users },
                { label: "Imported", value: result.summary.total_imported, icon: CheckCircle2 },
                { label: "Already Had", value: result.summary.total_skipped, icon: AlertCircle },
                { label: "Hot Leads", value: result.summary.hot_leads, icon: Flame },
                { label: "Strong", value: result.summary.strong_prospects, icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <s.icon className="w-5 h-5 mx-auto mb-1 text-white/80" />
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-Role Breakdown */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Results by Role</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(result.sweep_results).map(([role, data]) => (
                <div key={role} className="bg-slate-50 rounded-xl p-4">
                  <div className="font-semibold text-sm mb-2">{role}</div>
                  {data.error ? (
                    <div className="text-xs text-red-600">Error: {data.error}</div>
                  ) : (
                    <div className="space-y-1 text-xs text-muted">
                      <div>Found: <strong className="text-foreground">{data.found}</strong></div>
                      <div>Imported: <strong className="text-emerald-600">{data.imported}</strong></div>
                      <div>Skipped: <strong>{data.skipped}</strong></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Candidates */}
          {result.top_candidates.length > 0 && (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" /> Top Candidates from This Sweep
                </h3>
                <Link href="/pipeline" className="text-sm text-primary hover:underline">
                  View pipeline →
                </Link>
              </div>
              <div className="divide-y divide-border">
                {result.top_candidates.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/candidates/${c.id}`}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      c.score >= 70 ? "bg-red-100 text-red-700" :
                      c.score >= 50 ? "bg-orange-100 text-orange-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted flex items-center gap-2">
                        <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded">{c.role}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}, {c.state}</span>
                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        c.score >= 70 ? "text-red-600" : c.score >= 50 ? "text-orange-600" : "text-amber-600"
                      }`}>
                        {c.score}pts
                      </span>
                      {c.score >= 70 && <Flame className="w-4 h-4 text-red-500" />}
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
            <h3 className="font-semibold text-amber-800 mb-3">Recommended Next Steps</h3>
            <ol className="space-y-2 text-sm text-amber-700 list-decimal list-inside">
              <li><strong>Contact hot leads immediately</strong> — call or text within 24 hours</li>
              <li><strong>Send personalized outreach</strong> to strong prospects using templates</li>
              <li><strong>Download recruiting packets</strong> for each top candidate (click into their profile)</li>
              <li><strong>Schedule follow-ups</strong> for everyone you contact</li>
              <li><strong>Check CMS Intel</strong> to see if any top candidates work at understaffed competitors</li>
              <li><strong>Run sweep weekly</strong> to catch new license holders and transfers</li>
            </ol>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!running && !result && (
        <div className="text-center py-12 bg-white rounded-2xl border border-border">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-full bg-sky-50 flex items-center justify-center">
              <Radar className="w-10 h-10 text-sky-500" />
            </div>
          </div>
          <h3 className="font-semibold text-lg mb-2">Ready to Sweep</h3>
          <p className="text-muted max-w-md mx-auto text-sm">
            Select a building and roles above, then hit &quot;Launch Full Sweep&quot;.
            The system will scan the NPI Registry, import candidates,
            score them across 10 dimensions, and surface your hottest leads.
          </p>
        </div>
      )}
    </div>
  );
}
