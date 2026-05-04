import { apiFetch } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type EquipmentCategory = "Primary" | "Secondary" | "Melee" | "Utility";

export type EquipmentDto = {
  id: number;
  name: string;
  category: EquipmentCategory | string | null;
  quantity: number;
  description: string | null;
  effectiveness: number;
  imageUrl?: string | null;
  deletedAt: string | null;
  allocatedQuantity: number;
  availableQuantity: number;
};

export type CreateEquipmentRequest = {
  name: string;
  category: EquipmentCategory;
  quantity: number;
  description?: string | null;
  effectiveness: number;
};

export type UpdateEquipmentRequest = {
  category?: EquipmentCategory;
  quantity?: number;
  description?: string | null;
  effectiveness?: number;
};

export function getEquipment() {
  return apiFetch<EquipmentDto[]>("/api/equipment");
}

export function getEquipmentById(id: number) {
  return apiFetch<EquipmentDto>(`/api/equipment/${id}`);
}

export function createEquipment(body: CreateEquipmentRequest) {
  return apiFetch<EquipmentDto>("/api/equipment", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateEquipment(id: number, body: UpdateEquipmentRequest) {
  return apiFetch<EquipmentDto>(`/api/equipment/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteEquipment(id: number) {
  return apiFetch<void>(`/api/equipment/${id}`, {
    method: "DELETE",
  });
}

export function uploadEquipmentImage(id: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<EquipmentDto>(`/api/equipment/${id}/image`, {
    method: "PUT",
    body: formData,
  });
}

export function removeEquipmentImage(id: number) {
  return apiFetch<EquipmentDto>(`/api/equipment/${id}/image`, {
    method: "DELETE",
  });
}

export function resolveEquipmentImageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}