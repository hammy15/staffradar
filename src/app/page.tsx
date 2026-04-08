"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, Shield, Users, Building2, ArrowRight } from "lucide-react";

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

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Invalid credentials");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Radar circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[600px] h-[600px] rounded-full border border-white/10 animate-pulse-ring" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[400px] h-[400px] rounded-full border border-white/15 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[200px] h-[200px] rounded-full border border-white/20 animate-pulse-ring" style={{ animationDelay: "1s" }} />
          </div>
          {/* Sweep line */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] animate-radar-sweep">
            <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-white/40 to-transparent origin-left" />
          </div>
          {/* Blips */}
          {[
            { top: "30%", left: "25%", delay: "0s" },
            { top: "45%", left: "60%", delay: "1s" },
            { top: "65%", left: "35%", delay: "2s" },
            { top: "25%", left: "55%", delay: "0.5s" },
            { top: "70%", left: "65%", delay: "1.5s" },
          ].map((blip, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{ top: blip.top, left: blip.left, animationDelay: blip.delay }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <Radar className="w-10 h-10" />
            <span className="text-3xl font-bold tracking-tight">StaffRadar</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Healthcare Talent<br />Intelligence Platform
          </h1>
          <p className="text-lg text-white/80 max-w-md mb-12">
            Discover, analyze, and recruit top healthcare professionals before they even hit the job boards.
          </p>
          <div className="space-y-4">
            {[
              { icon: Users, text: "NPI Registry — Every licensed provider in the US" },
              { icon: Building2, text: "CMS Data — Identify understaffed competitors" },
              { icon: Shield, text: "Multi-source intelligence gathering" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Radar className="w-8 h-8 text-sky-500" />
            <span className="text-2xl font-bold tracking-tight">StaffRadar</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Sign in</h2>
          <p className="text-muted mb-8">Enter your name to access your recruiting dashboard</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Johnson"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                required
              />
            </div>

            {error && (
              <div className="text-danger text-sm bg-red-50 px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !password}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter StaffRadar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
