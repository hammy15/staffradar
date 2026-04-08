import { create } from "zustand";
import type { User, Building } from "./types";

interface AppState {
  user: User | null;
  buildings: Building[];
  activeBuilding: Building | null;
  sidebarOpen: boolean;
  setUser: (user: User | null) => void;
  setBuildings: (buildings: Building[]) => void;
  setActiveBuilding: (building: Building | null) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  buildings: [],
  activeBuilding: null,
  sidebarOpen: true,
  setUser: (user) => set({ user }),
  setBuildings: (buildings) => set({ buildings }),
  setActiveBuilding: (building) => set({ activeBuilding: building }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
