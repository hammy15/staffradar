"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !password) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), password }),
    });
    if (res.ok) router.push("/dashboard");
    else { const d = await res.json(); setError(d.error || "Invalid credentials"); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-sm px-6 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--teal)" opacity="0.2"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Cascadia Healthcare</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Talent Platform</p>
        </div>

        <div className="bg-[var(--bg-white)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name" className="w-full px-3 py-2.5 rounded-lg" required autoFocus />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" className="w-full px-3 py-2.5 rounded-lg" required />
            </div>
            {error && <div className="text-sm text-[var(--rose)] bg-[var(--rose-light)] px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading || !name.trim() || !password}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition disabled:opacity-40"
              style={{ background: "var(--teal)" }}>
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-[var(--text-muted)] text-[11px] mt-6">
          SNF &middot; ALF &middot; Home Health &middot; Hospice
        </p>
      </div>
    </div>
  );
}
