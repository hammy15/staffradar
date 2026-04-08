"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare, Send, Phone, Mail, Link2, Loader2,
  Clock, User, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { Candidate, Outreach } from "@/lib/types";

export default function OutreachPage() {
  const [outreach, setOutreach] = useState<(Outreach & { first_name?: string; last_name?: string; user_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    candidate_id: "",
    type: "email" as "sms" | "email" | "call" | "linkedin" | "other",
    subject: "",
    content: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/outreach").then((r) => r.json()),
      fetch("/api/candidates?limit=200").then((r) => r.json()),
    ]).then(([o, c]) => {
      setOutreach(o);
      setCandidates(c.candidates || []);
      setLoading(false);
    });
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.candidate_id || !form.content) return;
    setSending(true);

    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const newOutreach = await res.json();
      setOutreach([newOutreach, ...outreach]);
      setForm({ candidate_id: "", type: "email", subject: "", content: "" });
      setShowCompose(false);
      toast.success("Outreach logged!");
    } else {
      toast.error("Failed to log outreach");
    }
    setSending(false);
  }

  const typeIcons = {
    email: Mail,
    sms: MessageSquare,
    call: Phone,
    linkedin: Link2,
    other: MessageSquare,
  };

  const typeColors = {
    email: "bg-blue-50 text-blue-600",
    sms: "bg-green-50 text-green-600",
    call: "bg-amber-50 text-amber-600",
    linkedin: "bg-indigo-50 text-indigo-600",
    other: "bg-zinc-50 text-zinc-600",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Outreach</h2>
          <p className="text-muted mt-1">Track all candidate communications</p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition"
        >
          <Send className="w-4 h-4" />
          Log Outreach
        </button>
      </div>

      {/* Compose */}
      {showCompose && (
        <form onSubmit={handleSend} className="bg-white rounded-2xl border border-border p-6 animate-fade-in-up">
          <h3 className="font-semibold mb-4">New Outreach</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Candidate</label>
              <select
                value={form.candidate_id}
                onChange={(e) => setForm({ ...form, candidate_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              >
                <option value="">Select a candidate...</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} — {c.role_type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="call">Phone Call</option>
                <option value="linkedin">LinkedIn</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject (optional)</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Re: Nursing opportunity"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Content / Notes</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Describe the outreach..."
                required
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setShowCompose(false)} className="px-4 py-2 text-muted hover:text-foreground">
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Log
            </button>
          </div>
        </form>
      )}

      {/* History */}
      {outreach.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-lg mb-1">No outreach yet</h3>
          <p className="text-muted">Log your first candidate communication</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {outreach.map((o) => {
            const Icon = typeIcons[o.type] || MessageSquare;
            return (
              <div key={o.id} className="bg-white rounded-xl border border-border p-4 flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${typeColors[o.type]} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {o.first_name} {o.last_name}
                    </span>
                    <span className="text-xs text-muted capitalize">&middot; {o.type}</span>
                    {o.subject && <span className="text-xs text-muted">&middot; {o.subject}</span>}
                  </div>
                  <p className="text-sm text-muted line-clamp-2">{o.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(o.sent_at).toLocaleDateString()}
                    </span>
                    {o.user_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {o.user_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
