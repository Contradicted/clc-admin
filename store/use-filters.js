import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useFilters = create()(
  persist(
    (set) => ({
      columnFilters: [],
      globalFilter: "",
      setColumnFilters: (filters) => set({ columnFilters: filters }),
      setGlobalFilter: (value) => set({ globalFilter: value }),
      reset: () => set({ columnFilters: [], globalFilter: "" }),
    }),
    {
      name: "application-filters",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: false,
    }
  )
);
