import axiosClient from "./axiosClient";

export const uploadApi = {
  uploadFile: (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    return axiosClient.post<void, string>("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
