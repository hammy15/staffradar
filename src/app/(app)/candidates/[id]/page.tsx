"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, Award, Building2, Clock,
  Send, MessageSquare, Calendar, CheckCircle2, User, FileText,
  Loader2, Flame, Zap, Edit3, Save, X, Plus, ExternalLink,
  AlertCircle, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { STATUS_COLORS, ROLE_TYPES } from "@/lib/types";

interface Template {
  id: string;
  name: string;
  stage: string;
  type: string;
  subject: string | null;
  body: string;
  variables: string[];
}

interface ActivityItem {
  id: string;
  activity_type: string;
  type?: string;
  action?: string;
  content?: string;
  subject?: string;
  note?: string;
  details?: Record<string, unknown>;
  user_name?: string;
  sort_date: string;
  sent_at?: string;
  created_at?: string;
  due_date?: string;
  completed?: boolean;
}

const STATUSES: CandidateStatus[] = [
  "discovered", "researched", "contacted", "responded", "interested",
  "interviewing", "offered", "hired", "declined", "not_interested",
];

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70) return <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold flex items-center gap-1"><Flame className="w-4 h-4" />Hot Lead ({score})</span>;
  if (score >= 50) return <span className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">Strong ({score})</span>;
  if (score >= 30) return <span className="text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">Warm ({score})</span>;
  if (score > 0) return <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">Cool ({score})</span>;
  return <span className="text-sm text-muted">Not scored</span>;
}

export default function CandidateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, buildings, activeBuilding } = useAppStore();
  const [candidate, setCandidate] = useState<Candidate & { building_name?: string; outreach?: unknown[] } | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [followUps, setFollowUps] = useState<Array<{ id: string; type: string; note: string; due_date: string; completed: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});

  // Outreach compose
  const [showOutreach, setShowOutreach] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [outreachForm, setOutreachForm] = useState({ type: "email", to: "", subject: "", content: "", sendReal: false });
  const [sending, setSending] = useState(false);

  // Follow-up form
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ type: "callback", note: "", due_date: "" });

  const load = useCallback(async () => {
    const [cRes, aRes, tRes, fRes] = await Promise.all([
      fetch(`/api/candidates/${id}`),
      fetch(`/api/candidates/${id}/activity`),
      fetch("/api/templates"),
      fetch(`/api/follow-ups?candidate_id=${id}`),
    ]);
    if (cRes.ok) {
      const c = await cRes.json();
      setCandidate(c);
      setEditForm(c);
    }
    if (aRes.ok) setActivity(await aRes.json());
    if (tRes.ok) setTemplates(await tRes.json());
    if (fRes.ok) setFollowUps(await fRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateCandidate(updates: Record<string, unknown>) {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setCandidate({ ...candidate!, ...updated });
      // Log activity
      await fetch(`/api/candidates/${id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status_changed", details: updates, user_id: user?.id }),
      });
      toast.success("Updated");
      load();
    }
  }

  function applyTemplate(template: Template) {
    setSelectedTemplate(template);
    let body = template.body;
    let subject = template.subject || "";

    // Replace variables
    const vars: Record<string, string> = {
      first_name: candidate?.first_name || "",
      last_name: candidate?.last_name || "",
      role_type: candidate?.role_type || "",
      city: activeBuilding?.city || candidate?.city || "",
      state: activeBuilding?.state || candidate?.state || "",
      building_name: activeBuilding?.name || "",
      building_type: activeBuilding?.type || "",
      building_phone: activeBuilding?.phone || "",
      recruiter_name: user?.name || "",
      offer_amount: candidate?.offer_amount || "Competitive",
      interview_date: candidate?.interview_date ? new Date(candidate.interview_date).toLocaleDateString() : "TBD",
    };

    for (const [key, val] of Object.entries(vars)) {
      body = body.replace(new RegExp(`{{${key}}}`, "g"), val);
      subject = subject.replace(new RegExp(`{{${key}}}`, "g"), val);
    }

    setOutreachForm({
      ...outreachForm,
      type: template.type as "email" | "sms",
      subject,
      content: body,
      to: template.type === "email" ? (candidate?.email || "") : (candidate?.phone || ""),
    });
  }

  async function handleSendOutreach(e: React.FormEvent) {
    e.preventDefault();
    if (!outreachForm.content) return;
    setSending(true);

    const endpoint = outreachForm.sendReal && outreachForm.to ? "/api/outreach/send" : "/api/outreach";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id: id,
        user_id: user?.id,
        ...outreachForm,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (outreachForm.sendReal && data.sent) {
        toast.success(`${outreachForm.type.toUpperCase()} sent!`);
      } else {
        toast.success("Outreach logged");
      }
      setShowOutreach(false);
      setOutreachForm({ type: "email", to: "", subject: "", content: "", sendReal: false });
      setSelectedTemplate(null);

      // Update last_contacted_at
      await updateCandidate({ last_contacted_at: new Date().toISOString() });
      load();
    }
    setSending(false);
  }

  async function handleAddFollowUp(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: id, ...followUpForm }),
    });
    if (res.ok) {
      toast.success("Follow-up scheduled");
      setShowFollowUp(false);
      setFollowUpForm({ type: "callback", note: "", due_date: "" });
      load();
    }
  }

  async function completeFollowUp(fId: string) {
    await fetch(`/api/follow-ups/${fId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    toast.success("Follow-up completed");
    load();
  }

  async function handleSave() {
    await updateCandidate(editForm);
    setEditing(false);
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  if (!candidate) return <div className="text-center py-24 text-muted">Candidate not found</div>;

  const stageTemplates = templates.filter((t) => t.stage === candidate.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-muted hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{candidate.first_name} {candidate.last_name}</h2>
          <div className="flex items-center gap-3 mt-1">
            {candidate.credentials && <span className="text-muted">{candidate.credentials}</span>}
            <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">{candidate.role_type}</span>
            <ScoreBadge score={candidate.score} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={candidate.status}
            onChange={(e) => {
              const newStatus = e.target.value as CandidateStatus;
              const updates: Record<string, unknown> = { status: newStatus };
              if (newStatus === "hired") updates.hired_at = new Date().toISOString();
              updateCandidate(updates);
            }}
            className={`text-sm font-medium px-3 py-2 rounded-xl border-0 cursor-pointer ${STATUS_COLORS[candidate.status]}`}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact & Info */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Contact Information</h3>
              <button onClick={() => setEditing(!editing)} className="text-sm text-primary hover:underline flex items-center gap-1">
                {editing ? <><X className="w-3 h-3" /> Cancel</> : <><Edit3 className="w-3 h-3" /> Edit</>}
              </button>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={String(editForm.phone || "")} onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Phone" className="px-3 py-2 rounded-lg border border-border text-sm" />
                  <input value={String(editForm.email || "")} onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="Email" className="px-3 py-2 rounded-lg border border-border text-sm" />
                  <input value={String(editForm.address || "")} onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Address" className="px-3 py-2 rounded-lg border border-border text-sm col-span-2" />
                  <input value={String(editForm.city || "")} onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    placeholder="City" className="px-3 py-2 rounded-lg border border-border text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={String(editForm.state || "")} onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                      placeholder="State" className="px-3 py-2 rounded-lg border border-border text-sm" maxLength={2} />
                    <input value={String(editForm.zip || "")} onChange={(e) => setEditForm({...editForm, zip: e.target.value})}
                      placeholder="ZIP" className="px-3 py-2 rounded-lg border border-border text-sm" />
                  </div>
                  <input value={String(editForm.current_employer || "")} onChange={(e) => setEditForm({...editForm, current_employer: e.target.value})}
                    placeholder="Current Employer" className="px-3 py-2 rounded-lg border border-border text-sm" />
                  <select value={String(editForm.role_type || "")} onChange={(e) => setEditForm({...editForm, role_type: e.target.value})}
                    className="px-3 py-2 rounded-lg border border-border text-sm">
                    {ROLE_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <textarea value={String(editForm.notes || "")} onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  placeholder="Notes about this candidate..." rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none" />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editForm.is_traveler} onChange={(e) => setEditForm({...editForm, is_traveler: e.target.checked})} className="rounded" /> Travel nurse</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editForm.willingness_to_relocate} onChange={(e) => setEditForm({...editForm, willingness_to_relocate: e.target.checked})} className="rounded" /> Willing to relocate</label>
                </div>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg text-sm"><Save className="w-4 h-4" /> Save</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {candidate.phone && (
                    <a href={`tel:${candidate.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Phone className="w-4 h-4 text-muted" /> {candidate.phone}
                    </a>
                  )}
                  {candidate.email && (
                    <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Mail className="w-4 h-4 text-muted" /> {candidate.email}
                    </a>
                  )}
                  {candidate.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted" />
                      {candidate.address && `${candidate.address}, `}{candidate.city}, {candidate.state} {candidate.zip}
                    </div>
                  )}
                  {candidate.npi && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-muted" /> NPI: {candidate.npi}
                    </div>
                  )}
                  {candidate.building_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted" /> {(candidate as unknown as { building_name?: string }).building_name || "Assigned"}
                    </div>
                  )}
                  {candidate.current_employer && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted" /> Current: {candidate.current_employer}
                    </div>
                  )}
                </div>
                {candidate.specialty && <div className="text-sm text-muted">Specialty: {candidate.specialty}</div>}
                {candidate.license_state && <div className="text-sm text-muted">License: {candidate.license_state} {candidate.license_number}</div>}
                <div className="flex items-center gap-3 text-xs">
                  {candidate.is_traveler && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Traveler</span>}
                  {candidate.willingness_to_relocate && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Will Relocate</span>}
                </div>
                {candidate.notes && <div className="bg-slate-50 rounded-lg p-3 text-sm">{candidate.notes}</div>}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowOutreach(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl text-sm">
              <Send className="w-4 h-4" /> Send Outreach
            </button>
            <button onClick={() => setShowFollowUp(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl text-sm">
              <Bell className="w-4 h-4" /> Schedule Follow-up
            </button>
            {candidate.phone && (
              <a href={`tel:${candidate.phone}`}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl text-sm">
                <Phone className="w-4 h-4" /> Call Now
              </a>
            )}
            {candidate.email && (
              <a href={`mailto:${candidate.email}`}
                className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-slate-50 font-medium rounded-xl text-sm">
                <Mail className="w-4 h-4" /> Email Direct
              </a>
            )}
          </div>

          {/* Outreach Compose */}
          {showOutreach && (
            <div className="bg-white rounded-2xl border border-border p-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Compose Outreach</h3>
                <button onClick={() => { setShowOutreach(false); setSelectedTemplate(null); }} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>

              {/* Template Picker */}
              {stageTemplates.length > 0 && !selectedTemplate && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Suggested templates for &quot;{candidate.status}&quot; stage:</p>
                  <div className="flex flex-wrap gap-2">
                    {stageTemplates.map((t) => (
                      <button key={t.id} onClick={() => applyTemplate(t)}
                        className="text-xs px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition">
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border my-3" />
                  <p className="text-xs text-muted mb-2">All templates:</p>
                  <div className="flex flex-wrap gap-2">
                    {templates.filter((t) => t.stage !== candidate.status).map((t) => (
                      <button key={t.id} onClick={() => applyTemplate(t)}
                        className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition">
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSendOutreach} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={outreachForm.type} onChange={(e) => setOutreachForm({...outreachForm, type: e.target.value})}
                    className="px-3 py-2 rounded-lg border border-border text-sm">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="call">Phone Call</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="other">Other</option>
                  </select>
                  <input value={outreachForm.to}
                    onChange={(e) => setOutreachForm({...outreachForm, to: e.target.value})}
                    placeholder={outreachForm.type === "sms" ? "Phone number" : "Email address"}
                    className="px-3 py-2 rounded-lg border border-border text-sm" />
                </div>
                {outreachForm.type === "email" && (
                  <input value={outreachForm.subject}
                    onChange={(e) => setOutreachForm({...outreachForm, subject: e.target.value})}
                    placeholder="Subject line"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
                )}
                <textarea value={outreachForm.content}
                  onChange={(e) => setOutreachForm({...outreachForm, content: e.target.value})}
                  rows={8} placeholder="Message..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={outreachForm.sendReal}
                      onChange={(e) => setOutreachForm({...outreachForm, sendReal: e.target.checked})} className="rounded" />
                    Actually send via {outreachForm.type === "sms" ? "Twilio" : "SendGrid"}
                  </label>
                  <button type="submit" disabled={sending || !outreachForm.content}
                    className="flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg text-sm disabled:opacity-50">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {outreachForm.sendReal ? "Send" : "Log"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Follow-up Form */}
          {showFollowUp && (
            <form onSubmit={handleAddFollowUp} className="bg-white rounded-2xl border border-border p-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Schedule Follow-up</h3>
                <button type="button" onClick={() => setShowFollowUp(false)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={followUpForm.type} onChange={(e) => setFollowUpForm({...followUpForm, type: e.target.value})}
                  className="px-3 py-2 rounded-lg border border-border text-sm">
                  <option value="callback">Callback</option>
                  <option value="email_followup">Email Follow-up</option>
                  <option value="interview">Interview</option>
                  <option value="check_in">Check In</option>
                  <option value="send_offer">Send Offer</option>
                  <option value="custom">Custom</option>
                </select>
                <input type="datetime-local" value={followUpForm.due_date}
                  onChange={(e) => setFollowUpForm({...followUpForm, due_date: e.target.value})}
                  className="px-3 py-2 rounded-lg border border-border text-sm" required />
              </div>
              <textarea value={followUpForm.note} onChange={(e) => setFollowUpForm({...followUpForm, note: e.target.value})}
                placeholder="Notes..." rows={2} className="w-full mt-3 px-3 py-2 rounded-lg border border-border text-sm resize-none" />
              <button type="submit" className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm">
                <Calendar className="w-4 h-4" /> Schedule
              </button>
            </form>
          )}

          {/* Activity Feed */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            {activity.length === 0 ? (
              <p className="text-muted text-sm py-4 text-center">No activity yet. Send an outreach to get started.</p>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      item.activity_type === "outreach" ? "bg-blue-50 text-blue-600"
                      : item.activity_type === "followup" ? "bg-amber-50 text-amber-600"
                      : "bg-slate-50 text-slate-600"
                    }`}>
                      {item.activity_type === "outreach" ? <Send className="w-4 h-4" />
                       : item.activity_type === "followup" ? <Calendar className="w-4 h-4" />
                       : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium">
                          {item.activity_type === "outreach" ? `${item.type} ${item.subject ? `— ${item.subject}` : "sent"}`
                           : item.activity_type === "followup" ? `Follow-up: ${item.type || "scheduled"}`
                           : item.action || "Activity"}
                        </span>
                        {item.user_name && <span className="text-muted">by {item.user_name}</span>}
                      </div>
                      {item.content && <p className="text-muted line-clamp-2">{item.content}</p>}
                      {item.note && <p className="text-muted">{item.note}</p>}
                      <div className="text-xs text-muted mt-1">
                        {new Date(item.sort_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Follow-ups */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" /> Follow-ups
              </h4>
              <button onClick={() => setShowFollowUp(true)} className="text-xs text-primary hover:underline">+ Add</button>
            </div>
            {followUps.length === 0 ? (
              <p className="text-xs text-muted">No scheduled follow-ups</p>
            ) : (
              <div className="space-y-2">
                {followUps.map((f) => {
                  const overdue = !f.completed && new Date(f.due_date) < new Date();
                  return (
                    <div key={f.id} className={`flex items-start gap-2 text-sm p-2 rounded-lg ${overdue ? "bg-red-50" : "bg-slate-50"}`}>
                      <button onClick={() => completeFollowUp(f.id)} className="mt-0.5 shrink-0">
                        {f.completed
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <div className={`w-4 h-4 rounded-full border-2 ${overdue ? "border-red-400" : "border-slate-300"} hover:border-emerald-500`} />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="capitalize text-xs font-medium">{f.type.replace("_", " ")}</div>
                        {f.note && <div className="text-xs text-muted truncate">{f.note}</div>}
                        <div className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted"}`}>
                          {overdue ? "OVERDUE — " : ""}{new Date(f.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key Dates */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-sm mb-3">Key Dates</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Discovered</span><span>{new Date(candidate.created_at).toLocaleDateString()}</span></div>
              {candidate.last_contacted_at && <div className="flex justify-between"><span className="text-muted">Last Contacted</span><span>{new Date(candidate.last_contacted_at).toLocaleDateString()}</span></div>}
              {candidate.interview_date && <div className="flex justify-between"><span className="text-muted">Interview</span><span>{new Date(candidate.interview_date).toLocaleDateString()}</span></div>}
              {candidate.hired_at && <div className="flex justify-between"><span className="text-muted">Hired</span><span className="text-emerald-600 font-medium">{new Date(candidate.hired_at).toLocaleDateString()}</span></div>}
            </div>
          </div>

          {/* Assign to Building */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-sm mb-3">Assign to Building</h4>
            <select
              value={candidate.building_id || ""}
              onChange={(e) => updateCandidate({ building_id: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm"
            >
              <option value="">Unassigned</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Source Info */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-sm mb-3">Source</h4>
            <div className="text-sm">
              <div className="capitalize font-medium">{candidate.source.replace("_", " ")}</div>
              {candidate.source_detail && <div className="text-xs text-muted">{candidate.source_detail}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
