import axiosClient from "./axiosClient";
import type { Location, Tag, LocationEdit } from "@/types/database";
import type {
  LocationRequest,
  LocationEditRequest,
  TagRequest,
} from "@/types/api";

export const locationApi = {
  getAll: () => axiosClient.get<void, Location[]>("/locations"),

  getById: (id: number) => axiosClient.get<void, Location>(`/locations/${id}`),

  getByStatus: (status: string) =>
    axiosClient.get<void, Location[]>(`/locations/status/${status}`),

  getByUserId: (userId: number) =>
    axiosClient.get<void, Location[]>(`/locations/user/${userId}`),

  create: async (
    requestData: LocationRequest,
    imageFile?: File,
  ): Promise<Location> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(requestData));
    if (imageFile) {
      formData.append("image", imageFile);
    }
    const response = await axiosClient.post("/locations", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  update: async (
    id: number,
    requestData: Partial<LocationRequest>,
    imageFile?: File,
  ): Promise<Location> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(requestData));
    if (imageFile) {
      formData.append("image", imageFile);
    }
    const response = await axiosClient.put(`/locations/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  smartSearch: (prompt: string) =>
    axiosClient.get<void, Location[]>("/locations/smart-search", {
      params: { prompt },
    }),

  getNearby: (lat: number, lng: number, radius: number = 10.0) =>
    axiosClient.get<void, Location[]>("/locations/nearby", {
      params: { lat, lng, radius },
    }),

  searchByName: (name: string) =>
    axiosClient.get<void, Location[]>("/locations/search", {
      params: { name },
    }),

  // --- LOCATION EDITS ---
  submitEdit: (
    userId: number,
    locationId: number,
    requestDTO: LocationEditRequest,
    imageFile?: File,
  ) => {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(requestDTO)], { type: "application/json" }),
    );
    if (imageFile) formData.append("image", imageFile);

    return axiosClient.post<void, LocationEdit>(
      `/location-edits/user/${userId}/location/${locationId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },

  // --- TAGS ---
  getTags: () => axiosClient.get<void, Tag[]>("/tags"),

  getTagByName: (name: string) =>
    axiosClient.get<void, Tag>(`/tags/name/${name}`),

  createTag: (data: TagRequest) => axiosClient.post<void, Tag>("/tags", data),
};
