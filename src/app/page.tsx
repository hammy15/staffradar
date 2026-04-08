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
    if (res.ok) { router.push("/dashboard"); }
    else { const d = await res.json(); setError(d.error || "Invalid credentials"); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden noise-bg">
      {/* Ambient rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full border border-cyan-500/5 animate-pulse-soft" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full border border-cyan-500/8 animate-pulse-soft" style={{ animationDelay: "0.7s" }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[250px] h-[250px] rounded-full border border-cyan-500/12 animate-pulse-soft" style={{ animationDelay: "1.4s" }} />
      </div>
      {/* Sweep line */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px]" style={{ animation: "radar-rotate 8s linear infinite" }}>
          <div className="absolute top-1/2 left-1/2 w-1/2 h-[1px] bg-gradient-to-r from-cyan-400/30 to-transparent origin-left" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-6 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/20 mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-glow">StaffRadar</h1>
          <p className="text-secondary text-sm mt-2">Healthcare Talent Intelligence</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-secondary uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              id="name" type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-xl text-sm transition"
              required autoFocus
            />
          </div>
          <div>
            <label htmlFor="pw" className="block text-xs font-medium text-secondary uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="pw" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl text-sm transition"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !password}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed
              bg-gradient-to-r from-cyan-500 to-teal-400 text-gray-900 hover:from-cyan-400 hover:to-teal-300
              shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin mx-auto" />
            ) : (
              "Enter StaffRadar"
            )}
          </button>
        </form>

        <p className="text-center text-muted text-xs mt-8">
          Talent intelligence for SNF, ALF, Home Health & Hospice
        </p>
      </div>
    </div>
  );
}
