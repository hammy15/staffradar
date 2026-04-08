"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Loader2, Flame, GripVertical, Phone, Mail, MapPin,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";

const PIPELINE_STAGES: { status: CandidateStatus; label: string; color: string }[] = [
  { status: "discovered", label: "Discovered", color: "border-t-zinc-400" },
  { status: "researched", label: "Researched", color: "border-t-blue-400" },
  { status: "contacted", label: "Contacted", color: "border-t-amber-400" },
  { status: "responded", label: "Responded", color: "border-t-purple-400" },
  { status: "interested", label: "Interested", color: "border-t-emerald-400" },
  { status: "interviewing", label: "Interviewing", color: "border-t-cyan-400" },
  { status: "offered", label: "Offered", color: "border-t-orange-400" },
  { status: "hired", label: "Hired", color: "border-t-green-500" },
];

export default function PipelinePage() {
  const router = useRouter();
  const { activeBuilding } = useAppStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "500" });
    if (activeBuilding) params.set("building_id", activeBuilding.id);
    const res = await fetch(`/api/candidates?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setCandidates(data.candidates);
    }
    setLoading(false);
  }, [activeBuilding]);

  useEffect(() => { load(); }, [load]);

  async function moveCandidate(candidateId: string, newStatus: CandidateStatus) {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "hired") updates.hired_at = new Date().toISOString();

    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
      );
      toast.success(`Moved to ${newStatus}`);
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, status: CandidateStatus) {
    e.preventDefault();
    if (draggedId) {
      moveCandidate(draggedId, status);
      setDraggedId(null);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipeline Board</h2>
          <p className="text-muted text-sm mt-1">Drag candidates between stages. Click to view details.</p>
        </div>
        <div className="text-sm text-muted">{candidates.length} candidates</div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 220px)" }}>
        {PIPELINE_STAGES.map((stage) => {
          const stageCandidates = candidates.filter((c) => c.status === stage.status);
          return (
            <div
              key={stage.status}
              className={`flex-shrink-0 w-[280px] bg-slate-50 rounded-2xl border-t-4 ${stage.color} flex flex-col`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.status)}
            >
              {/* Column header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <span className="text-xs bg-white px-2 py-0.5 rounded-full font-medium text-muted">{stageCandidates.length}</span>
              </div>

              {/* Cards */}
              <div className="px-2 pb-2 flex-1 space-y-2 overflow-y-auto">
                {stageCandidates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted opacity-50">
                    Drop candidates here
                  </div>
                ) : (
                  stageCandidates.sort((a, b) => b.score - a.score).map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onClick={() => router.push(`/candidates/${c.id}`)}
                      className={`bg-white rounded-xl p-3 border border-border hover:shadow-md transition cursor-pointer group ${
                        draggedId === c.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">
                              {c.first_name} {c.last_name}
                            </span>
                            {c.score >= 70 && <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-medium">{c.role_type}</span>
                            {c.score > 0 && <span className="text-xs text-muted">{c.score}pts</span>}
                          </div>
                          {c.city && (
                            <div className="flex items-center gap-1 text-xs text-muted mt-1.5">
                              <MapPin className="w-3 h-3" /> {c.city}, {c.state}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            {c.phone && <Phone className="w-3 h-3 text-slate-300" />}
                            {c.email && <Mail className="w-3 h-3 text-slate-300" />}
                            {c.is_traveler && <span className="text-[10px] bg-purple-50 text-purple-600 px-1 rounded">Travel</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
