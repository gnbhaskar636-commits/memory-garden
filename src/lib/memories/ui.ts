import { create } from "zustand";
import type { Memory } from "./types";

export type PlantStep = "choose" | "write" | "photo" | "voice";

interface GardenUiState {
  plantOpen: boolean;
  plantStep: PlantStep;
  editing: Memory | null;
  wanderOpen: boolean;
  wanderId: string | null;
  planting: boolean;
  lastPlantedId: string | null;
  openPlant: (options?: { step?: PlantStep; memory?: Memory }) => void;
  closePlant: () => void;
  setPlantStep: (step: PlantStep) => void;
  openWander: (id: string) => void;
  closeWander: () => void;
  beginPlanting: (id: string) => void;
  endPlanting: () => void;
}

export const useGardenUi = create<GardenUiState>((set) => ({
  plantOpen: false,
  plantStep: "choose",
  editing: null,
  wanderOpen: false,
  wanderId: null,
  planting: false,
  lastPlantedId: null,
  openPlant: (options) =>
    set({
      plantOpen: true,
      plantStep: options?.memory ? "write" : (options?.step ?? "choose"),
      editing: options?.memory ?? null,
    }),
  closePlant: () =>
    set({
      plantOpen: false,
      plantStep: "choose",
      editing: null,
    }),
  setPlantStep: (plantStep) => set({ plantStep }),
  openWander: (wanderId) => set({ wanderOpen: true, wanderId }),
  closeWander: () => set({ wanderOpen: false, wanderId: null }),
  beginPlanting: (lastPlantedId) => set({ planting: true, lastPlantedId }),
  endPlanting: () => set({ planting: false }),
}));
