'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  label: string;
  price: number;
  type:
    | 'plan'
    | 'slug'
    | 'boost'
    | 'cv'
    | 'classified'
    | 'classified_highlight'
    | 'credits'
    | 'brand_ad'
    | 'directory_company'
    | 'video'
    | 'ai_topup'
    | 'mystic_tarot'
    | 'mystic_lottery'
    | 'profile_loop_video'
    | 'feed_subscription'
    | 'marketing_campaign_setup';
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  total: () => number;
}

function notifyCartAnalytics(wasOpen: boolean) {
  if (typeof window === 'undefined' || wasOpen) return;
  queueMicrotask(() => window.dispatchEvent(new CustomEvent('tb-analytics-cart-open')));
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item) => {
        if (get().items.find(i => i.id === item.id)) {
          const wasOpen = get().isOpen;
          set({ isOpen: true });
          notifyCartAnalytics(wasOpen);
          return;
        }
        const wasOpen = get().isOpen;
        set(s => ({ items: [...s.items, item], isOpen: true }));
        notifyCartAnalytics(wasOpen);
      },
      remove: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      clear: () => set({ items: [] }),
      open: () =>
        set((s) => {
          notifyCartAnalytics(s.isOpen);
          return { isOpen: true };
        }),
      close: () => set({ isOpen: false }),
      total: () => get().items.reduce((sum, i) => sum + i.price, 0),
    }),
    {
      name: 'tb-cart',
      // Only persist items, not isOpen
      partialize: (state) => ({ items: state.items }),
    }
  )
);
