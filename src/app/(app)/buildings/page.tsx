"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, MapPin, Phone, X, Radar } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { Building, BuildingType } from "@/lib/types";
import { BUILDING_TYPE_LABELS } from "@/lib/types";

const TYPES: BuildingType[] = ["SNF", "ALF", "HH", "Hospice"];

export default function BuildingsPage() {
  const { buildings, setBuildings } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "SNF" as BuildingType, address: "", city: "", state: "", zip: "", phone: "",
  });

  useEffect(() => {
    fetch("/api/buildings").then((r) => r.json()).then(setBuildings);
  }, [setBuildings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/buildings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const b = await res.json();
      setBuildings([...buildings, b]);
      setForm({ name: "", type: "SNF", address: "", city: "", state: "", zip: "", phone: "" });
      setShowForm(false);
      toast.success("Building added!");
    } else {
      toast.error("Failed to add building");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/buildings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBuildings(buildings.filter((b) => b.id !== id));
      toast.success("Building removed");
    }
  }

  const typeColors: Record<BuildingType, string> = {
    SNF: "bg-blue-100 text-blue-700",
    ALF: "bg-purple-100 text-purple-700",
    HH: "bg-emerald-100 text-emerald-700",
    Hospice: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Buildings</h2>
          <p className="text-muted mt-1">Manage your facilities</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Building"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 animate-fade-in-up">
          <h3 className="font-semibold mb-4">New Building</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Building Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Sunrise Senior Living"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as BuildingType })}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{BUILDING_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="123 Main Street"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP</label>
                <input
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Building"}
            </button>
          </div>
        </form>
      )}

      {/* Building List */}
      {buildings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-lg mb-1">No buildings yet</h3>
          <p className="text-muted mb-4">Add your first facility to start scanning for talent</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition"
          >
            Add Your First Building
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {buildings.map((b: Building) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{b.name}</h3>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${typeColors[b.type as BuildingType]}`}>
                    {BUILDING_TYPE_LABELS[b.type as BuildingType]}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-slate-300 hover:text-danger transition opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {b.address}, {b.city}, {b.state} {b.zip}
                </div>
                {b.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    {b.phone}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
