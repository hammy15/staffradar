"use client";

import { useState } from "react";
import {
  Radar, Search, Download, UserPlus, MapPin, Phone, Award,
  ChevronDown, ChevronUp, Filter, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { ROLE_TYPES, US_STATES } from "@/lib/types";

interface NpiResult {
  npi: string;
  first_name: string;
  last_name: string;
  credential: string;
  gender: string;
  enumeration_date: string;
  last_updated: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  taxonomy_desc: string;
  taxonomy_code: string;
  license_state: string;
  license_number: string;
}

export default function RadarPage() {
  const { activeBuilding, buildings } = useAppStore();
  const [results, setResults] = useState<NpiResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState({
    role_type: "RN",
    state: activeBuilding?.state || "",
    city: activeBuilding?.city || "",
    postal_code: "",
    first_name: "",
    last_name: "",
    limit: "50",
  });

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setImportResult(null);

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    const res = await fetch(`/api/radar/npi?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
      setSelected(new Set());
      if (data.results?.length === 0) {
        toast.info("No results found. Try broadening your search.");
      }
    } else {
      toast.error("Search failed");
    }
    setLoading(false);
  }

  function toggleSelect(npi: string) {
    const next = new Set(selected);
    if (next.has(npi)) next.delete(npi);
    else next.add(npi);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((r) => r.npi)));
    }
  }

  async function handleImport() {
    if (selected.size === 0) return;
    setImporting(true);

    const candidates = results
      .filter((r) => selected.has(r.npi))
      .map((r) => ({ ...r, role_type: filters.role_type }));

    const res = await fetch("/api/radar/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidates,
        building_id: activeBuilding?.id || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setImportResult(data);
      toast.success(`Imported ${data.imported} candidates`);
      if (data.skipped > 0) {
        toast.info(`${data.skipped} already in pipeline`);
      }
    } else {
      toast.error("Import failed");
    }
    setImporting(false);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Radar className="w-6 h-6 text-sky-500" />
            Talent Radar
          </h2>
          <p className="text-muted mt-1">
            Search the NPI Registry — every licensed healthcare provider in the US
          </p>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-500" />
            <span className="font-semibold">Search Filters</span>
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFilters && (
          <div className="px-6 pb-6 border-t border-border pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role Type</label>
                <select
                  value={filters.role_type}
                  onChange={(e) => setFilters({ ...filters, role_type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {ROLE_TYPES.filter((r) => ["RN", "CNA", "LPN", "Med Tech", "Physical Therapist", "Occupational Therapist", "Speech Therapist", "Social Worker"].includes(r)).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <select
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">All States</option>
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
                  placeholder="e.g. Dallas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code</label>
                <input
                  value={filters.postal_code}
                  onChange={(e) => setFilters({ ...filters, postal_code: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. 75201"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  value={filters.first_name}
                  onChange={(e) => setFilters({ ...filters, first_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  value={filters.last_name}
                  onChange={(e) => setFilters({ ...filters, last_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Results Limit</label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200 (max)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {loading ? "Scanning..." : "Scan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-4">
              <span className="font-semibold">{total.toLocaleString()} providers found</span>
              <span className="text-sm text-muted">{selected.size} selected</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-sm text-primary hover:underline"
              >
                {selected.size === results.length ? "Deselect all" : "Select all"}
              </button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition disabled:opacity-50 text-sm"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Import to Pipeline
              </button>
            </div>
          </div>

          {importResult && (
            <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Imported {importResult.imported} candidates</span>
              {importResult.skipped > 0 && (
                <span className="text-muted">({importResult.skipped} already existed)</span>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === results.length && results.length > 0}
                      onChange={selectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Provider</th>
                  <th className="px-4 py-3 text-left font-medium">NPI</th>
                  <th className="px-4 py-3 text-left font-medium">Specialty</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">License</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.npi}
                    className={`border-b border-border hover:bg-slate-50 transition cursor-pointer ${
                      selected.has(r.npi) ? "bg-sky-50" : ""
                    }`}
                    onClick={() => toggleSelect(r.npi)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(r.npi)}
                        onChange={() => toggleSelect(r.npi)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.first_name} {r.last_name}
                        {r.credential && <span className="text-muted ml-1">{r.credential}</span>}
                      </div>
                      <div className="text-xs text-muted">
                        {r.gender === "M" ? "Male" : r.gender === "F" ? "Female" : ""} &middot; Since {r.enumeration_date}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.npi}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                        {r.taxonomy_desc}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted" />
                        {r.city}, {r.state} {r.zip?.substring(0, 5)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted" />
                          {r.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.license_state && (
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-muted" />
                          {r.license_state} {r.license_number}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full border-2 border-sky-200 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-sky-300 flex items-center justify-center">
                <Radar className="w-8 h-8 text-sky-500" />
              </div>
            </div>
          </div>
          <h3 className="font-semibold text-lg mb-2">Ready to Scan</h3>
          <p className="text-muted max-w-md mx-auto">
            Search the NPI Registry to find licensed healthcare providers by role, location, and name.
            Results include practice addresses, phone numbers, and license details.
          </p>
        </div>
      )}
    </div>
  );
}
