// src/store/useFavoritesStore.ts
import { create } from "zustand";
import { interactApi } from "@/api/interactApi";

interface FavoritesState {
  favorites: Set<number>;
  setFavorites: (locationIds: number[]) => void;
  fetchUserFavorites: (userId: number) => Promise<void>;
  toggleFavorite: (userId: number, locationId: number) => Promise<void>;
}

const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set(),

  setFavorites: (locationIds) => {
    set({ favorites: new Set(locationIds) });
  },

  fetchUserFavorites: async (userId) => {
    try {
      const locations = await interactApi.getFavorites(userId);
      // Trích xuất mảng locationId từ danh sách địa điểm trả về
      const locationIds = locations.map((loc) => loc.id);
      set({ favorites: new Set(locationIds) });
    } catch (error) {
      console.error("Lỗi khi tải danh sách yêu thích:", error);
    }
  },

  toggleFavorite: async (userId, locationId) => {
    const isFavorited = get().favorites.has(locationId);

    set((state) => {
      const newFavorites = new Set(state.favorites);
      if (isFavorited) newFavorites.delete(locationId);
      else newFavorites.add(locationId);
      return { favorites: newFavorites };
    });

    try {
      await interactApi.toggleFavorite(userId, locationId);
    } catch (error) {
      console.error("Lỗi khi cập nhật favorite:", error);
      set((state) => {
        const rollbackFavorites = new Set(state.favorites);
        if (isFavorited) rollbackFavorites.add(locationId);
        else rollbackFavorites.delete(locationId);
        return { favorites: rollbackFavorites };
      });
    }
  },
}));

export default useFavoritesStore;
