"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_QTY = 99;

export type CartItem = {
  productId: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  /** Display price only — the server always recomputes totals from the DB. */
  price: number;
  imagePath: string | null;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  drawerOpen: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  sync: (updates: Pick<CartItem, "productId" | "price" | "stock">[], removedIds: string[]) => void;
  clear: () => void;
  setDrawerOpen: (open: boolean) => void;
};

const clampQty = (quantity: number, stock: number) =>
  Math.max(1, Math.min(quantity, stock, MAX_QTY));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          const items = existing
            ? state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      ...item,
                      quantity: clampQty(i.quantity + quantity, item.stock),
                    }
                  : i,
              )
            : [...state.items, { ...item, quantity: clampQty(quantity, item.stock) }];
          return { items, drawerOpen: true };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: clampQty(quantity, i.stock) } : i,
          ),
        })),
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      sync: (updates, removedIds) =>
        set((state) => ({
          items: state.items
            .filter((i) => !removedIds.includes(i.productId))
            .map((i) => {
              const u = updates.find((x) => x.productId === i.productId);
              return u
                ? {
                    ...i,
                    price: u.price,
                    stock: u.stock,
                    quantity: Math.min(i.quantity, u.stock),
                  }
                : i;
            })
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
    }),
    {
      name: "lw-cart",
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Avoid SSR/client mismatch: persisted cart is only known after mount. */
const noopSubscribe = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
