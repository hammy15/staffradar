"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList, Search, ExternalLink, MapPin, Loader2,
  Shield, Users, FileText,
} from "lucide-react";
import { US_STATES } from "@/lib/types";

interface BoardInfo {
  name: string;
  url: string;
  verification_url: string;
  notes: string;
}

interface CnaRegistry {
  name: string;
  url: string;
}

interface BoardResult {
  state?: string;
  nursing_board?: BoardInfo | null;
  cna_registry?: CnaRegistry | null;
  tip?: string;
  nursing_boards?: Record<string, BoardInfo>;
  cna_registries?: Record<string, CnaRegistry>;
  total_boards?: number;
  total_cna_registries?: number;
}

export default function BoardsPage() {
  const [selectedState, setSelectedState] = useState("");
  const [data, setData] = useState<BoardResult | null>(null);
  const [allBoards, setAllBoards] = useState<BoardResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/radar/nursing-boards")
      .then((r) => r.json())
      .then((d) => {
        setAllBoards(d);
        setLoading(false);
      });
  }, []);

  async function handleStateSelect(state: string) {
    setSelectedState(state);
    if (!state) {
      setData(null);
      return;
    }
    const res = await fetch(`/api/radar/nursing-boards?state=${state}`);
    if (res.ok) setData(await res.json());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-sky-500" />
          State Licensing Boards
        </h2>
        <p className="text-muted mt-1">
          Direct links to state nursing board verification portals and CNA registries.
          Check for newly licensed nurses — they&apos;re actively job seeking.
        </p>
      </div>

      {/* How to use */}
      <div className="bg-sky-50 rounded-2xl border border-sky-200 p-5">
        <h3 className="font-semibold text-sky-800 mb-2">Recruiting From Licensing Boards</h3>
        <ol className="space-y-1.5 text-sm text-sky-700 list-decimal list-inside">
          <li>Visit the state verification portal below</li>
          <li>Search for recently issued licenses (last 30-90 days)</li>
          <li>New licenses = newly certified professionals actively seeking employment</li>
          <li>License transfers into your state = someone who just moved and needs a job</li>
          <li>Import prospects into StaffRadar&apos;s Talent Radar and add to your pipeline</li>
        </ol>
      </div>

      {/* State Selector */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Select a State</label>
            <select
              value={selectedState}
              onChange={(e) => handleStateSelect(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">View all states</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Single State Detail */}
      {data && selectedState && (
        <div className="space-y-4 animate-fade-in-up">
          {data.nursing_board && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{data.nursing_board.name}</h3>
                  <p className="text-xs text-muted">{data.nursing_board.notes}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href={data.nursing_board.verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition text-sm"
                >
                  <Search className="w-4 h-4" />
                  Verify Licenses
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={data.nursing_board.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 border border-border hover:bg-slate-50 font-medium rounded-xl transition text-sm"
                >
                  Board Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {data.cna_registry && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{data.cna_registry.name}</h3>
                  <p className="text-xs text-muted">CNA Registry & Verification</p>
                </div>
              </div>
              <a
                href={data.cna_registry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition text-sm w-fit"
              >
                <Search className="w-4 h-4" />
                Search CNA Registry
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {data.tip && (
            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
              <FileText className="w-4 h-4 inline mr-1" />
              {data.tip}
            </div>
          )}
        </div>
      )}

      {/* All Boards Grid */}
      {!selectedState && allBoards && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">
              All State Nursing Boards ({allBoards.total_boards} states)
            </h3>
            <span className="text-sm text-muted">
              {allBoards.total_cna_registries} CNA registries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium">State</th>
                  <th className="px-4 py-3 text-left font-medium">Board Name</th>
                  <th className="px-4 py-3 text-left font-medium">Notes</th>
                  <th className="px-4 py-3 text-left font-medium">CNA Registry</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allBoards.nursing_boards && Object.entries(allBoards.nursing_boards).sort().map(([st, board]) => {
                  const cna = allBoards.cna_registries?.[st];
                  return (
                    <tr key={st} className="border-b border-border hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold">{st}</td>
                      <td className="px-4 py-3">{board.name}</td>
                      <td className="px-4 py-3 text-muted text-xs">{board.notes}</td>
                      <td className="px-4 py-3">
                        {cna ? (
                          <a
                            href={cna.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs flex items-center gap-1"
                          >
                            Available <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={board.verification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition text-xs font-medium"
                        >
                          Verify <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
