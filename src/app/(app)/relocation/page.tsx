"use client";

import { useState } from "react";
import {
  ArrowRightLeft, ArrowRight, DollarSign, Home, Shield, MapPin,
  TrendingUp, TrendingDown, Loader2, CheckCircle2, AlertTriangle,
  Sparkles,
} from "lucide-react";
import { US_STATES } from "@/lib/types";
import { COMPACT_STATES } from "@/lib/scoring";

interface RelocationResult {
  from_state: string;
  to_state: string;
  col_from: number;
  col_to: number;
  col_savings_pct: number;
  salary_from: number;
  salary_to: number;
  salary_diff: number;
  purchasing_power_gain_pct: number;
  compact_from: boolean;
  compact_to: boolean;
  license_transfer_easy: boolean;
  housing_cost_index_from: number;
  housing_cost_index_to: number;
  relocation_score: number;
  incentives: string[];
  challenges: string[];
}

export default function RelocationPage() {
  const [fromState, setFromState] = useState("");
  const [toState, setToState] = useState("");
  const [result, setResult] = useState<RelocationResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!fromState || !toState) return;
    setLoading(true);
    const res = await fetch(`/api/radar/relocation?from=${fromState}&to=${toState}`);
    if (res.ok) setResult(await res.json());
    setLoading(false);
  }

  function scoreColor(score: number) {
    if (score >= 70) return "text-emerald-600 bg-emerald-50";
    if (score >= 50) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-sky-500" />
          Relocation Calculator
        </h2>
        <p className="text-muted mt-1">
          Compare cost of living, salaries, housing, and license reciprocity between states.
          Use this to pitch relocation to out-of-state candidates.
        </p>
      </div>

      {/* Compact License Map */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-500" />
          Nurse Licensure Compact States ({COMPACT_STATES.size} states)
        </h3>
        <p className="text-sm text-muted mb-4">
          Nurses with a compact license can practice in any of these states without getting a new license.
        </p>
        <div className="flex flex-wrap gap-2">
          {US_STATES.map((s) => (
            <span
              key={s}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                COMPACT_STATES.has(s)
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">Compare Two States</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Candidate&apos;s State</label>
            <select
              value={fromState}
              onChange={(e) => setFromState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <ArrowRight className="w-5 h-5 text-muted mb-3" />
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Your Building&apos;s State</label>
            <select
              value={toState}
              onChange={(e) => setToState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={analyze}
            disabled={!fromState || !toState || loading}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Score */}
          <div className="bg-white rounded-2xl border border-border p-6 text-center">
            <div className="text-sm text-muted mb-2">Relocation Score</div>
            <div className={`inline-flex items-center gap-2 text-4xl font-bold px-6 py-2 rounded-xl ${scoreColor(result.relocation_score)}`}>
              {result.relocation_score}
              <span className="text-lg font-normal">/100</span>
            </div>
            <p className="text-sm text-muted mt-2">
              {result.relocation_score >= 70
                ? "Excellent — strong financial incentive to relocate"
                : result.relocation_score >= 50
                ? "Moderate — some benefits, needs good pitch"
                : "Challenging — may need signing bonus or other perks"}
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold">Cost of Living</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{result.from_state}</span>
                  <span className="font-semibold">{result.col_from} index</span>
                </div>
                <div className="flex justify-between">
                  <span>{result.to_state}</span>
                  <span className="font-semibold">{result.col_to} index</span>
                </div>
                <div className={`flex items-center gap-1 font-medium ${result.col_savings_pct > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {result.col_savings_pct > 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {Math.abs(result.col_savings_pct)}% {result.col_savings_pct > 0 ? "cheaper" : "more expensive"}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-sky-500" />
                <span className="font-semibold">RN Salary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{result.from_state}</span>
                  <span className="font-semibold">${(result.salary_from / 1000).toFixed(0)}k avg</span>
                </div>
                <div className="flex justify-between">
                  <span>{result.to_state}</span>
                  <span className="font-semibold">${(result.salary_to / 1000).toFixed(0)}k avg</span>
                </div>
                <div className={`font-medium ${result.salary_diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {result.salary_diff >= 0 ? "+" : ""}${(result.salary_diff / 1000).toFixed(0)}k difference
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Housing</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{result.from_state}</span>
                  <span className="font-semibold">{result.housing_cost_index_from} index</span>
                </div>
                <div className="flex justify-between">
                  <span>{result.to_state}</span>
                  <span className="font-semibold">{result.housing_cost_index_to} index</span>
                </div>
                <div className={`font-medium ${result.housing_cost_index_to < result.housing_cost_index_from ? "text-emerald-600" : "text-red-600"}`}>
                  {result.housing_cost_index_to < result.housing_cost_index_from ? "Cheaper" : "More expensive"} housing
                </div>
              </div>
            </div>
          </div>

          {/* Purchasing Power */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="font-semibold">Purchasing Power</span>
            </div>
            <p className="text-sm text-muted">
              Adjusted for cost of living, a nurse moving from {result.from_state} to {result.to_state} would have{" "}
              <span className={`font-semibold ${result.purchasing_power_gain_pct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {result.purchasing_power_gain_pct >= 0 ? "+" : ""}{result.purchasing_power_gain_pct}%
              </span>{" "}
              purchasing power.
            </p>
          </div>

          {/* License */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-sky-500" />
              <span className="font-semibold">License Transfer</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className={`px-3 py-1 rounded-full ${result.compact_from ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                {result.from_state}: {result.compact_from ? "Compact" : "Non-Compact"}
              </span>
              <ArrowRight className="w-4 h-4 text-muted" />
              <span className={`px-3 py-1 rounded-full ${result.compact_to ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                {result.to_state}: {result.compact_to ? "Compact" : "Non-Compact"}
              </span>
            </div>
            <p className="text-sm text-muted mt-2">
              {result.license_transfer_easy
                ? "Both states are in the Nurse Licensure Compact. A nurse can start working immediately with their existing license."
                : "License endorsement application required. Typical processing time: 2-8 weeks."}
            </p>
          </div>

          {/* Incentives & Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.incentives.length > 0 && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
                <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Selling Points
                </h4>
                <ul className="space-y-2">
                  {result.incentives.map((inc, i) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {inc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.challenges.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Challenges
                </h4>
                <ul className="space-y-2">
                  {result.challenges.map((ch, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {ch}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
