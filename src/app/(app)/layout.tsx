"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Radar, LayoutDashboard, Building2, Users,
  MessageSquare, BarChart3, LogOut, Menu, X, ChevronDown,
  MapPin, ArrowRightLeft, Shield, Briefcase, TrendingUp, Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Building } from "@/lib/types";

const NAV_SECTIONS = [
  {
    label: "Command",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/buildings", icon: Building2, label: "Buildings" },
    ],
  },
  {
    label: "Discover",
    items: [
      { href: "/sweep", icon: Zap, label: "Full Sweep" },
      { href: "/radar", icon: Radar, label: "NPI Search" },
      { href: "/intelligence", icon: BarChart3, label: "CMS Intel" },
      { href: "/military", icon: Shield, label: "Military" },
      { href: "/workforce", icon: TrendingUp, label: "Workforce" },
    ],
  },
  {
    label: "Recruit",
    items: [
      { href: "/pipeline", icon: Briefcase, label: "Pipeline" },
      { href: "/candidates", icon: Users, label: "Candidates" },
      { href: "/outreach", icon: MessageSquare, label: "Outreach" },
      { href: "/relocation", icon: ArrowRightLeft, label: "Relocation" },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, buildings, setBuildings, activeBuilding, setActiveBuilding, sidebarOpen, toggleSidebar } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [buildingDropdown, setBuildingDropdown] = useState(false);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/auth/me");
      if (!res.ok) { router.push("/"); return; }
      const { user } = await res.json();
      setUser(user);
      const bRes = await fetch("/api/buildings");
      if (bRes.ok) setBuildings(await bRes.json());
      setLoading(false);
    }
    init();
  }, [router, setUser, setBuildings]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Radar className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-muted text-sm">Initializing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex noise-bg">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}
        style={{ background: "rgba(11, 15, 26, 0.95)", borderRight: "1px solid var(--border-dim)" }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-5 shrink-0" style={{ borderBottom: "1px solid var(--border-dim)" }}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/30 to-teal-500/20 flex items-center justify-center">
            <Radar className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-bold tracking-tight text-glow">StaffRadar</span>
          <button onClick={toggleSidebar} className="ml-auto lg:hidden text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Building Selector */}
        <div className="px-3 py-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
          <div className="relative">
            <button
              onClick={() => setBuildingDropdown(!buildingDropdown)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-xs hover:bg-[var(--bg-elevated)]"
              style={{ background: "var(--bg-panel)" }}
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate flex-1 text-left text-secondary">
                {activeBuilding ? activeBuilding.name : "All Buildings"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
            </button>
            {buildingDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--border-glow)" }}>
                <button
                  onClick={() => { setActiveBuilding(null); setBuildingDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-elevated)] ${!activeBuilding ? "text-cyan-400 font-medium" : "text-secondary"}`}
                >
                  All Buildings
                </button>
                {buildings.map((b: Building) => (
                  <button
                    key={b.id}
                    onClick={() => { setActiveBuilding(b); setBuildingDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-elevated)] ${activeBuilding?.id === b.id ? "text-cyan-400 font-medium" : "text-secondary"}`}
                  >
                    <div>{b.name}</div>
                    <div className="text-[10px] text-muted">{b.city}, {b.state} &middot; {b.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition
                        ${isActive
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "text-secondary hover:text-foreground hover:bg-[var(--bg-elevated)]"
                        }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-muted"}`} />
                      {item.label}
                      {item.href === "/sweep" && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold">
                          NEW
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border-dim)" }}>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/20 flex items-center justify-center text-[11px] font-bold text-cyan-300">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user?.name}</div>
              <div className="text-[10px] text-muted capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-muted hover:text-rose-400 transition" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={toggleSidebar} />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-4 px-6 shrink-0"
          style={{ borderBottom: "1px solid var(--border-dim)", background: "rgba(11, 15, 26, 0.6)", backdropFilter: "blur(12px)" }}>
          <button onClick={toggleSidebar} className="lg:hidden text-muted hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-secondary">
            {NAV_SECTIONS.flatMap((s) => s.items).find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "StaffRadar"}
          </h1>
          {activeBuilding && (
            <span className="text-xs text-muted ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-beacon" />
              {activeBuilding.name}
            </span>
          )}
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
