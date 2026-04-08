"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Radar, LayoutDashboard, Building2, Users,
  MessageSquare, BarChart3, LogOut, Menu, X, ChevronDown,
  MapPin, ArrowRightLeft, Shield, Briefcase, TrendingUp, Zap,
  Search, AlertCircle, Globe,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Building } from "@/lib/types";

const NAV_SECTIONS = [
  {
    label: "Portfolio",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/buildings", icon: Building2, label: "All Buildings" },
    ],
  },
  {
    label: "Discover",
    items: [
      { href: "/sweep", icon: Zap, label: "Full Sweep" },
      { href: "/sources", icon: Globe, label: "All Sources" },
      { href: "/radar", icon: Search, label: "NPI Search" },
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <Radar className="w-7 h-7 text-[var(--teal)] animate-spin" />
          <span className="text-[var(--text-muted)] text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Group buildings by state for sidebar
  const stateGroups: Record<string, Building[]> = {};
  buildings.forEach((b) => {
    if (!stateGroups[b.state]) stateGroups[b.state] = [];
    stateGroups[b.state].push(b);
  });
  const stateNames: Record<string, string> = { ID: "Idaho", WA: "Washington", OR: "Oregon", MT: "Montana", AZ: "Arizona" };

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-[var(--bg-white)] border-r border-[var(--border)] transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}
      >
        {/* Logo */}
        <div className="h-12 flex items-center gap-2 px-4 border-b border-[var(--border)] shrink-0">
          <div className="w-6 h-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--teal)" opacity="0.2"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text)] leading-tight">Cascadia Healthcare</div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Talent Platform</div>
          </div>
          <button onClick={toggleSidebar} className="ml-auto lg:hidden text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Nav sections */}
          <nav className="py-2 px-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="mb-3">
                <div className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  {section.label}
                </div>
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition
                        ${isActive
                          ? "bg-[var(--teal-light)] text-[var(--teal)] font-semibold"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                        }`}
                    >
                      <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-[var(--teal)]" : "text-[var(--text-muted)]"}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* By State */}
          <div className="px-2 pb-2">
            <div className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              By State
            </div>
            {Object.entries(stateGroups).sort().map(([state, blds]) => (
              <button
                key={state}
                onClick={() => {
                  // Filter to first building in state or clear
                  if (activeBuilding?.state === state) { setActiveBuilding(null); }
                  else { setActiveBuilding(blds[0]); }
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] transition
                  ${activeBuilding?.state === state
                    ? "bg-[var(--teal-light)] text-[var(--teal)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
              >
                <span>{stateNames[state] || state}</span>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">{blds.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User */}
        <div className="p-2 border-t border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-[10px] font-bold text-[var(--teal)]">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate">{user?.name}</div>
            </div>
            <button onClick={handleLogout} className="text-[var(--text-muted)] hover:text-[var(--rose)] transition">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={toggleSidebar} />}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 flex items-center gap-4 px-6 bg-[var(--bg-white)] border-b border-[var(--border)] shrink-0">
          <button onClick={toggleSidebar} className="lg:hidden text-[var(--text-muted)]">
            <Menu className="w-5 h-5" />
          </button>

          {/* Search box — Cascadia style */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              placeholder="Search buildings, candidates..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md text-[12px] !border-[var(--border-light)]"
              readOnly
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {activeBuilding && (
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] animate-beacon" />
                {activeBuilding.name}
                <button onClick={() => setActiveBuilding(null)} className="ml-1 hover:text-[var(--text)]">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {buildings.filter((b) => b.status === "urgent").length > 0 && (
              <Link href="/buildings?status=urgent" className="flex items-center gap-1 text-[11px] text-[var(--rose)] font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {buildings.filter((b) => b.status === "urgent").length} Alerts
              </Link>
            )}
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
