"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Radar, LayoutDashboard, Building2, Search, Users,
  MessageSquare, BarChart3, LogOut, Menu, X, ChevronDown,
  MapPin, ArrowRightLeft, Shield, Briefcase, TrendingUp, ClipboardList, Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Building } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/buildings", icon: Building2, label: "Buildings" },
  { href: "/radar", icon: Radar, label: "Talent Radar" },
  { href: "/sweep", icon: Zap, label: "Full Sweep" },
  { href: "/pipeline", icon: Briefcase, label: "Pipeline Board" },
  { href: "/candidates", icon: Users, label: "Candidates" },
  { href: "/outreach", icon: MessageSquare, label: "Outreach" },
  { href: "/intelligence", icon: BarChart3, label: "CMS Intel" },
  { href: "/relocation", icon: ArrowRightLeft, label: "Relocation" },
  { href: "/military", icon: Shield, label: "Military" },
  { href: "/workforce", icon: TrendingUp, label: "Workforce" },
  { href: "/boards", icon: ClipboardList, label: "Licensing" },
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
      if (!res.ok) {
        router.push("/");
        return;
      }
      const { user } = await res.json();
      setUser(user);

      const bRes = await fetch("/api/buildings");
      if (bRes.ok) {
        const b = await bRes.json();
        setBuildings(b);
      }
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Radar className="w-10 h-10 text-primary animate-spin" />
          <span className="text-muted">Loading StaffRadar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform duration-200 flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <Radar className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">StaffRadar</span>
          <button onClick={toggleSidebar} className="ml-auto lg:hidden text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Building Selector */}
        <div className="px-3 py-3 border-b border-border">
          <div className="relative">
            <button
              onClick={() => setBuildingDropdown(!buildingDropdown)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-sm"
            >
              <MapPin className="w-4 h-4 text-muted shrink-0" />
              <span className="truncate flex-1 text-left">
                {activeBuilding ? activeBuilding.name : "All Buildings"}
              </span>
              <ChevronDown className="w-4 h-4 text-muted shrink-0" />
            </button>
            {buildingDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setActiveBuilding(null); setBuildingDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${!activeBuilding ? "font-semibold text-primary" : ""}`}
                >
                  All Buildings
                </button>
                {buildings.map((b: Building) => (
                  <button
                    key={b.id}
                    onClick={() => { setActiveBuilding(b); setBuildingDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${activeBuilding?.id === b.id ? "font-semibold text-primary" : ""}`}
                  >
                    <div>{b.name}</div>
                    <div className="text-xs text-muted">{b.city}, {b.state} &middot; {b.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${isActive
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-sky-500" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-semibold text-sky-700">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-muted hover:text-danger transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center gap-4 px-6 border-b border-border bg-white shrink-0">
          <button onClick={toggleSidebar} className="lg:hidden text-muted hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "StaffRadar"}
          </h1>
          {activeBuilding && (
            <span className="text-sm text-muted ml-auto flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {activeBuilding.name}
            </span>
          )}
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
