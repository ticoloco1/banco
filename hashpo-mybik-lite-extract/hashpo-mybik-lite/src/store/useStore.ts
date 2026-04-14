import { create } from "zustand";
import { 
  PlatformSettings, 
  VideoSlot, 
  defaultSettings, 
  generateMockVideos 
} from "@/data/mockDatabase";

interface AppStore {
  settings: PlatformSettings;
  videos: VideoSlot[];
  updateSettings: (s: Partial<PlatformSettings>) => void;
  toggleFeatured: (id: number) => void;
  toggleBlocked: (id: number) => void;
  toggleExchange: (id: number) => void;
}

export const useStore = create<AppStore>((set) => ({
  settings: defaultSettings,
  videos: generateMockVideos(),
  updateSettings: (s) =>
    set((state) => ({ settings: { ...state.settings, ...s } })),
  toggleFeatured: (id) =>
    set((state) => ({
      videos: state.videos.map((v) =>
        v.id === id ? { ...v, featured: !v.featured } : v
      ),
    })),
  toggleBlocked: (id) =>
    set((state) => ({
      videos: state.videos.map((v) =>
        v.id === id ? { ...v, blocked: !v.blocked } : v
      ),
    })),
  toggleExchange: (id) =>
    set((state) => ({
      videos: state.videos.map((v) =>
        v.id === id ? { ...v, exchangeActive: !v.exchangeActive } : v
      ),
    })),
}));
