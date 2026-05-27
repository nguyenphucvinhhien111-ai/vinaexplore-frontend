import { create } from "zustand";

interface FilterState {
  selectedTagId: number | "All";
  setTagId: (id: number | "All") => void;
  resetFilter: () => void;
}

const useFilterStore = create<FilterState>((set) => ({
  selectedTagId: "All",
  setTagId: (id) => set({ selectedTagId: id }),
  resetFilter: () => set({ selectedTagId: "All" }),
}));

export default useFilterStore;
